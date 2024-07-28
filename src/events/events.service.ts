import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { User } from "src/auth/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Event } from "./entities/event.entity";
import { StatusEnum } from "src/common/enums/status.enum";
import { Image } from "./dto/imageName.dto";
import { Category } from "src/categories/entities/category.entity";
import { RolesEnum } from "src/common/enums/roles.enum";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ) {}

  async create(
    createEventDto: CreateEventDto,
    user: User,
    files: Image
  ): Promise<Event> {
    const { categoryId, imageName, ...eventData } = createEventDto;
    const category = await this.categoryRepository.findOneBy({
      id: +categoryId,
    });

    if (!category) throw new NotFoundException("Category not found");

    const event = this.eventRepository.create({
      ...eventData,
      category,
      user,
      imageName: imageName,
    });

    await this.eventRepository.save(event);

    delete event.user;

    return event;
  }

  async findAll(user: User): Promise<Event[]> {
    let showAllEvents: Boolean = false;

    const queryBuilder = await this.eventRepository
      .createQueryBuilder("event")
      .select([
        "event.id",
        "event.title",
        "event.imageName",
        "event.description",
        "event.date",
        "event.quota",
        "event.location",
        "event.duration",
        "event.allDay",
        "event.published",
      ])
      .leftJoin("event.category", "category")
      .addSelect(["category.id", "category.title"])
      .loadRelationCountAndMap(
        "event.usersQuantity",
        "event.userEvents",
        "userEvent",
        (qb) =>
          qb.andWhere("userEvent.status = :status", {
            status: StatusEnum.Active,
          })
      );

    if (user.userRoles.some((userRole) => userRole.role.title == RolesEnum.Admin)) {
      showAllEvents = true;
    }

    if (!showAllEvents) {
      queryBuilder.where("event.published = :published", { published: true });
    }

    const events = await queryBuilder.getMany();
    return events;
  }

  async findOne(id: number): Promise<Event> {
    const eventId = id;

    const events = await this.eventRepository
      .createQueryBuilder("event")
      .select([
        "event.id",
        "event.title",
        "event.imageName",
        "event.description",
        "event.date",
        "event.quota",
        "event.location",
        "event.duration",
        "event.allDay",
        "event.published",
      ])
      .leftJoin("event.category", "category")
      .addSelect(["category.id", "category.title"])
      .loadRelationCountAndMap(
        "event.usersQuantity",
        "event.userEvents",
        "userEvent",
        (qb) =>
          qb.andWhere("userEvent.status = :status", {
            status: StatusEnum.Active,
          })
      )
      .where("event.id = :eventId", { eventId })
      .getOne();

    if (!events) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return events;
  }

  async update(
    id: number,
    updateEventDto: UpdateEventDto,
    user: User
  ): Promise<Event> {
    const event = await this.eventRepository.preload({
      id,
      ...updateEventDto,
    });

    if (!event) throw new NotFoundException("Event not found");

    event.user = user;

    Object.assign(event, updateEventDto);

    const updated = await this.eventRepository.save(event);

    delete updated.user;
    return updated;
  }

  async remove(id: number): Promise<Boolean> {
    const event = await this.eventRepository.findOneBy({ id });

    if (!event) throw new NotFoundException("Event not found");

    event.status = StatusEnum.Inactive;

    await this.eventRepository.save(event);

    return true;
  }
}
