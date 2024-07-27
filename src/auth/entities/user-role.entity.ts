import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { StatusEnum } from "src/common/enums/status.enum";
import { Role } from "src/roles/entities/role.entity";

@Entity()
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userRoles)
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles)
  role: Role;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({
    type: "varchar",
    length: "2",
    default: StatusEnum.Active,
  })
  status: string;
}
