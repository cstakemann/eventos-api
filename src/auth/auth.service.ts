import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { LoginUserDto } from "./dto/login-user.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { JwtService } from "@nestjs/jwt";
import { Role } from "src/roles/entities/role.entity";
import { RolesEnum } from "src/common/enums/roles.enum";
import { UserRole } from "./entities/user-role.entity";
import { StatusEnum } from "src/common/enums/status.enum";
import { ConfigService } from "@nestjs/config";
import { LoggerMiddleware } from "src/common/middleware/logger.middleware";

@Injectable()
export class AuthService {
  logger: any;
  private authSecret: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.authSecret = this.configService.get("AUTH_SECRET");
    this.logger = new Logger(LoggerMiddleware.name);
  }

  async create(createAuthDto: CreateUserDto) {
    const { email, name, password } = createAuthDto;
    const userName = email.split("@")[0];

    let isUserNameRegistered = await this.findUserByUserName(userName);

    let user: User;
    if (isUserNameRegistered) {
      this.logger.debug(`loginWithPassword start: email: ${email}`);
      user = await this.loginWithPassword(email, password);
      this.logger.debug(`loginWithPassword end: user: ${user.email}`);
    } else {
      this.logger.debug(`createUserWithPassword: user: ${email}`);

      if(!name) throw new BadRequestException("name must be a string");

      user = await this.createUserWithPassword(email, name, password, userName);
      this.logger.debug(`createUserWithPassword end: user: ${user.email}`);
    }
    
    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  async login(loginAuthDto: LoginUserDto) {
    const { email, name, authToken } = loginAuthDto;

    if (this.authSecret != authToken)
      throw new UnauthorizedException("You need a valid token");

    let user = await this.findUser(email);

    if (!user) {
      user = await this.createUser(email, name);
    }

    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  async createUser(email: string, name: string): Promise<User> {
    const role = await this.roleRepository.findOne({
      where: { title: RolesEnum.Viewer },
      select: { title: true, id: true },
    });

    if (!role) throw new NotFoundException("Role not found");

    const user = this.userRepository.create({
      email,
      name,
    });

    await this.userRepository.save(user);

    const userRole = this.userRoleRepository.create({
      user,
      role,
      status: StatusEnum.Active,
    });
    await this.userRoleRepository.save(userRole);

    delete user.createdAt;
    delete user.updatedAt;
    delete user.status;

    delete userRole.createdAt;
    delete userRole.updatedAt;
    delete userRole.user;
    delete userRole.role.id;

    user.userRoles = [userRole];
    return user;
  }

  async findUser(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email, userRoles: { status: StatusEnum.Active } },
      relations: ["userRoles", "userRoles.role"],
      select: {
        email: true,
        id: true,
        name: true,
        userRoles: { id: true, status: true, role: { title: true } },
      },
    });

    /* if (!user || !bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException("Credentials are not valid"); */

    return user;
  }

  async findUserByUserName(userName: string): Promise<number> {
    const user = await this.userRepository.count({
      where: { userName, status: StatusEnum.Active, userRoles: { status: StatusEnum.Active } },
    });

    return user;
  }

  async loginWithPassword(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email, status: StatusEnum.Active, userRoles: { status: StatusEnum.Active } },
      relations: ["userRoles", "userRoles.role"],
      select: {
        email: true,
        password: true,
        id: true,
        name: true,
        userRoles: { id: true, status: true, role: { title: true } },
      },
    });

    if (!user || !bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException("Credentials are not valid");

    return user;
  }

  async createUserWithPassword(email: string, name: string, password: string, userName: string): Promise<User> {
    const role = await this.roleRepository.findOne({
      where: { title: RolesEnum.Viewer },
      select: { title: true, id: true },
    });

    if (!role) throw new NotFoundException("Role not found");

    const user = this.userRepository.create({
      password: this.encryptPassword(password),
      email,
      name,
      userName
    });

    await this.userRepository.save(user);

    const userRole = await this.createUserRole(user, role);

    delete user.createdAt;
    delete user.updatedAt;
    delete user.status;
    delete user.password;

    delete userRole.createdAt;
    delete userRole.updatedAt;
    delete userRole.user;
    delete userRole.role.id;

    user.userRoles = [userRole];

    return user;
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private getRefreshJwtToken(payload: JwtPayload, expiresIn: string) {
    const token = this.jwtService.sign(payload, { expiresIn: expiresIn });
    return token;
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      // console.log(`payload: `, payload);

      return { token: this.getJwtToken({ id: payload.id }) };
    } catch (e) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async createUserRole(user: User, role: Role): Promise<UserRole> {
    const userRole = this.userRoleRepository.create({
      user,
      role,
      status: StatusEnum.Active,
    });
    return await this.userRoleRepository.save(userRole);
  }

  encryptPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }
}
