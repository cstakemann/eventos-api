import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { StatusEnum } from "src/common/enums/status.enum";
import { User } from "src/auth/entities/user.entity";
import { Event } from "./event.entity";

@Entity("user_events")
export class UserEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userEvents)
  user: User;

  @ManyToOne(() => Event, (event) => event.userEvents)
  event: Event;

  @Column("text", {
    nullable: true,
  })
  notes: string;

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

  @Column("bool",{
    default: false
  })
  attended: boolean;
}
