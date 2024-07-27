import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { StatusEnum } from "src/common/enums/status.enum";
import { UserEvent } from "./user-event.entity";
import { EventDocument } from "./event-documents.entity";
import { User } from "src/auth/entities/user.entity";
import { Category } from "src/categories/entities/category.entity";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  title: string;

  @Column("text", {
    nullable: true,
  })
  imageName: string;

  @Column("text", {
    nullable: true,
  })
  description: string;

  @Column("text", {
    nullable: true,
  })
  instructions: string;

  @ManyToOne(() => Category, (categoria) => categoria.events)
  category: Category;

  @ManyToOne(() => User, (user) => user.events)
  user: User;

  @OneToMany(() => UserEvent, (userEvent) => userEvent.event)
  userEvents: UserEvent[];

  @OneToMany(() => EventDocument, (eventDocument) => eventDocument.event)
  eventDocuments: EventDocument[];

  @Column("text")
  time: string;

  @Column({ type: "date" })
  date: string;

  @Column("int")
  quota: number;

  @Column("text")
  location: string;

  @Column("text")
  duration: string;

  @Column("bool", {
    default: false
  })
  allDay: boolean;

  @Column("bool",{
    default: false
  })
  published: boolean;

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
