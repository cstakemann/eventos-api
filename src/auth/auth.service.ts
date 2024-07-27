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

@Injectable()
export class AuthService {
  logger: any;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService
  ) {}

  async create(createAuthDto: CreateUserDto) {
    const role = await this.roleRepository.findOne({
      where: { title: RolesEnum.Admin },
      select: { title: true, id: true },
    });

    if (!role) throw new NotFoundException("Role not found");

    const { password, ...userData } = createAuthDto;

    const user = this.userRepository.create({
      ...userData,
      password: bcrypt.hashSync(password, 10),
    });

    await this.userRepository.save(user);

    const userRole = this.userRoleRepository.create({
      user,
      role,
      status: StatusEnum.Active,
    });
    await this.userRoleRepository.save(userRole);

    delete user.password;
    delete user.createdAt;
    delete user.updatedAt;

    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  async login(loginAuthDto: LoginUserDto) {
    const { email, password } = loginAuthDto;
    const user = await this.userRepository.findOne({
      where: { email, userRoles: { status: StatusEnum.Active } },
      relations: ["userRoles", "userRoles.role"],
      select: {
        email: true,
        password: true,
        id: true,
        userName: true,
        userRoles: { id: true, status: true, role: { title: true } },
      },
    });

    if (!user || !bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException("Credentials are not valid");

    delete user.password;
    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
      refreshToken: this.getRefreshJwtToken({ id: user.id }, "7d"),
    };
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
