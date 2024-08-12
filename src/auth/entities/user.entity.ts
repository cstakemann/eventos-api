import { StatusEnum } from "src/common/enums/status.enum";
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "./user-role.entity";
import { UserEvent } from "src/events/entities/user-event.entity";
import { EventDocument } from "src/events/entities/event-documents.entity";
import { Event } from "src/events/entities/event.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => UserRole, userRole => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => UserEvent, userEvent => userEvent.user)
  userEvents: UserEvent[];

  @OneToMany(() => EventDocument, eventDocument => eventDocument.user)
  eventDocuments: EventDocument[];

  @OneToMany(() => Event, (event) => event.user)
  events: Event[];

  @Column("text", {
    unique: true,
  })
  email: string;

  @Column("text")
  userName: string;

  @Column("text")
  name: string;

  @Column("text", {
    select: false,
  })
  password: string;

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

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }
}
