import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

import { StatusEnum } from "src/common/enums/status.enum";
import { Event } from "src/events/entities/event.entity";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Event, (event) => event.category)
  events: Event[];

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "varchar", length: 255 })
  color: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Column({
    type: "varchar",
    length: "2",
    default: StatusEnum.Active,
  })
  status: string;
}
