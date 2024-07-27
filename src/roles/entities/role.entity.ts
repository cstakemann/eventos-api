import { UserRole } from "src/auth/entities/user-role.entity";
import { StatusEnum } from "src/common/enums/status.enum";
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text", {
    unique: true,
  })
  title: string;

  @Column("text", {
    nullable: true,
  })
  description: string;

  @OneToMany(() => UserRole, userRole => userRole.role)
  userRoles: UserRole[];

  @Column({
    type: "varchar",
    length: "2",
    default: StatusEnum.Active,
  })
  status: string;
}
