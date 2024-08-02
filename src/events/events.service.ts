import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
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
import { UserEventDto } from "./dto/user-event.dto";
import { UserEvent } from "./entities/user-event.entity";
import { UserEventStatusEnum } from "src/common/enums/user-event-status.enum";
import { EventDocument } from "./entities/event-documents.entity";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    @InjectRepository(EventDocument)
    private readonly eventDocumentRepository: Repository<EventDocument>,
    private readonly configService: ConfigService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    user: User,
    files: Image
  ): Promise<Event> {
    console.log(`files: `,files)
    const { categoryId, mainImage, ...eventData } = createEventDto;
    const category = await this.categoryRepository.findOneBy({
      id: +categoryId,
    });

    if (!category) throw new NotFoundException("Category not found");

    const event = this.eventRepository.create({
      ...eventData,
      category,
      user,
      mainImage: mainImage,
    });

    await this.eventRepository.save(event);

    if(files && Object.keys(files).length > 0) {
      const baseUrl = this.configService.get('BASE_URL');
      const eventDocuments = files.images.map(image => {
        const url = `${baseUrl}${image.filename}`;
        return this.eventDocumentRepository.create({
          documentName: image.filename,
          documentUrl: url,
          user,
          event,
          status: StatusEnum.Active
        });
      });

      await this.eventDocumentRepository.save(eventDocuments);
    }

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
        "event.mainImage",
        "event.description",
        "event.instructions",
        "event.date",
        "event.quota",
        "event.location",
        "event.duration",
        "event.allDay",
        "event.published",
      ])
      .leftJoin("event.category", "category")
      .addSelect(["category.id", "category.title", "category.color"])
      .leftJoin("event.eventDocuments", "images")
      .addSelect(["images.id", "images.documentName", "images.documentUrl"])
      .loadRelationCountAndMap(
        "event.usersQuantity",
        "event.userEvents",
        "userEvent",
        (qb) =>
          qb.andWhere("userEvent.status = :status", {
            status: StatusEnum.Active,
          })
      )
      .loadRelationCountAndMap(
        "event.isUserRegistered",
        "event.userEvents",
        "userEvent",
        (qb) =>
          qb.andWhere('userEvent.status = :status', {
            status: StatusEnum.Active,
          })
          .andWhere('userEvent.userId = :userId', {
            userId: user.id,
          })
      );

    if (user.userRoles.some((userRole) => userRole.role.title == RolesEnum.Admin)) {
      showAllEvents = true;
    }

    if (!showAllEvents) {
      queryBuilder.where("event.published = :published", { published: true });
    }

    queryBuilder.orderBy("event.id","DESC");

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
        "event.mainImage",
        "event.description",
        "event.instructions",
        "event.date",
        "event.quota",
        "event.location",
        "event.duration",
        "event.allDay",
        "event.published",
      ])
      .leftJoin("event.category", "category")
      .addSelect(["category.id", "category.title", "category.color"])
      .leftJoin("event.eventDocuments", "images")
      .addSelect(["images.id", "images.documentName", "images.documentUrl"])
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

  async registerUser(userEventDto: UserEventDto, user: User): Promise<UserEvent>  {
    const { eventId } = userEventDto;

    const event = await this.eventRepository.findOneBy({ id: eventId });
    if (!event) {
      throw new NotFoundException(`Event not found`);
    }

    const validateUserEvent = await this.validateUserEvent(eventId, user);
    if (validateUserEvent) {
      throw new ConflictException(`User is already registered for this event`);
    }

    const userEvent = this.userEventRepository.create({
      event,
      user,
      status: UserEventStatusEnum.Active
    });

    await this.userEventRepository.save(userEvent);

    delete userEvent.user;
    delete userEvent.event;
    delete userEvent.notes;
    delete userEvent.updatedAt;
    delete userEvent.status;

    return userEvent;
  }

  async validateUserEvent(eventId: number, user: User): Promise<Boolean> {

    const userEvent = await this.userEventRepository.count({
      where: { event: { id: eventId }, user: { id: user.id }, status: UserEventStatusEnum.Active },
    });

    return userEvent > 0;
  }
}
