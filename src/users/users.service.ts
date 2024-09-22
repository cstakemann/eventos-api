import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { Repository } from "typeorm";
import { Role } from "src/roles/entities/role.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { StatusEnum } from "src/common/enums/status.enum";
import { User } from "src/auth/entities/user.entity";
import { UserRole } from "src/auth/entities/user-role.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) {}

  async findAll(): Promise<User[]> {

    const users = await this.userRepository
      .createQueryBuilder("users")
      .andWhere("users.status = :status", { status: StatusEnum.Active })
      .leftJoinAndSelect("users.userRoles", "userRoles",)
      .andWhere("userRoles.status = :status", {
        status: StatusEnum.Active,
      })
      .leftJoinAndSelect("userRoles.role", "role")
      .select([
        "users.id",
        "users.name",
        "users.status",
        "userRoles.id",
        "userRoles.status",
        "role.title"
      ])
      .getMany();

    return users;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async updateUserRole(id: number, updateUserRoleDto: UpdateUserRoleDto): Promise<UserRole> {
    const { roleId, userId } = updateUserRoleDto;
    let userRole: UserRole;

    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      select: { title: true, id: true },
    });

    if (!role) throw new NotFoundException("Role not found");

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new NotFoundException("User not found");

    const userRoles = await this.userRoleRepository.find({
      where: {
        user: { id: userId}
      },
      relations: {
        role: true
      }
    });

    if(userRoles.some(userRole => userRole.role.id == roleId)) {
      const userRoleIndex = userRoles.findIndex(userRole => userRole.role.id == roleId);
      userRole = userRoles[userRoleIndex];
      userRole.status = (userRole.status == StatusEnum.Active) ? StatusEnum.Inactive : StatusEnum.Active;
    } else {
      userRole = this.userRoleRepository.create({
        user,
        role,
        status: StatusEnum.Active,
      });
    }

    const updated = await this.userRoleRepository.save(userRole);

    delete updated.createdAt;
    delete updated.updatedAt;
    delete updated.user;
    delete updated.role.description;
    delete updated.role.status;

    return updated;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
