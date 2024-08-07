import {
  Injectable,
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
}
