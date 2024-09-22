import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { User } from "src/auth/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Not, Repository } from "typeorm";
import { Event } from "./entities/event.entity";
import { StatusEnum } from "src/common/enums/status.enum";
import { EventImage, Image } from "./dto/imageName.dto";
import { Category } from "src/categories/entities/category.entity";
import { RolesEnum } from "src/common/enums/roles.enum";
import { UserEventDto } from "./dto/user-event.dto";
import { UserEvent } from "./entities/user-event.entity";
import { UserEventStatusEnum } from "src/common/enums/user-event-status.enum";
import { EventDocument } from "./entities/event-documents.entity";
import { ConfigService } from "@nestjs/config";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { UpdateUserEventDto } from "./dto/update-user-event.dto";
import { UpdateAttendedUser } from "./dto/update-attended-user.dto";

@Injectable()
export class EventsService {
  private defaultLimit: number;

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(UserEvent)
    private readonly userEventRepository: Repository<UserEvent>,
    @InjectRepository(EventDocument)
    private readonly eventDocumentRepository: Repository<EventDocument>,
    private readonly configService: ConfigService
  ) {
    this.defaultLimit = this.configService.get("DEFAULT_LIMIT");
  }

  async create(
    createEventDto: CreateEventDto,
    user: User,
    files: Image
  ): Promise<Event> {
    console.log(`files: `, files);
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

    if (files && Object.keys(files).length > 0) {
      await this.createEventDocuments(files, user, event);
    }

    delete event.user;

    return event;
  }

  async findAll(paginationDto: PaginationDto, user: User): Promise<Event[]> {
    const { limit = this.defaultLimit, offset = 0, published } = paginationDto;
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
        "event.time",
        "event.quota",
        "event.location",
        "event.duration",
        "event.allDay",
        "event.published",
      ])
      .leftJoin("event.category", "category")
      .addSelect(["category.id", "category.title", "category.color"])
      .leftJoin("event.eventDocuments", "eventDocuments",)
      .andWhere("eventDocuments.status = :status", { status: StatusEnum.Active })
      .addSelect([
        "eventDocuments.id",
        "eventDocuments.documentName",
        "eventDocuments.documentUrl",
      ])
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
        "event.isUserEnrolled",
        "event.userEvents",
        "userEvent",
        (qb) =>
          qb
            .andWhere("userEvent.status = :status", {
              status: StatusEnum.Active,
            })
            .andWhere("userEvent.userId = :userId", {
              userId: user.id,
            })
      );

    if (user.userRoles.some((userRole) => userRole.role.title == RolesEnum.Admin)) {
      showAllEvents = true;
    }

    if (!showAllEvents) {
      queryBuilder.where("event.published = :published", { published: true });
    }

    if (showAllEvents && published) {
      queryBuilder.where("event.published = :published", {
        published: published,
      });
    }

    queryBuilder.andWhere("event.status = :status", { status: StatusEnum.Active })
    queryBuilder.orderBy("event.id", "DESC");

    // const events = await queryBuilder.limit(Number(limit)).getMany();
    const events = await queryBuilder.take(limit).skip(offset).getMany();

    // Transform the results
    const transformedEvents = events.map((event) => {
      // Organize the images array
      let images = event.eventDocuments || [];
      const mainImageIndex = images.findIndex(
        (img) => img.documentName === event.mainImage
      );

      if (mainImageIndex !== -1) {
        const mainImage = images.splice(mainImageIndex, 1)[0];
        images = [mainImage, ...images];
      }

      return {
        ...event,
        images,
      };
    });

    // Remove the original property to clean up the result
    transformedEvents.forEach((event) => {
      delete event.eventDocuments;
    });

    return transformedEvents;
  }

  async findOne(id: number, user: User): Promise<Event> {
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
        "event.time",
        "event.quota",
        "event.location",
        "event.duration",
        "event.allDay",
        "event.published",
      ])
      .leftJoin("event.category", "category")
      .addSelect(["category.id", "category.title", "category.color"])
      .leftJoin("event.eventDocuments", "eventDocuments")
      .addSelect([
        "eventDocuments.id",
        "eventDocuments.documentName",
        "eventDocuments.documentUrl",
      ])
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
        "event.isUserEnrolled",
        "event.userEvents",
        "userEvent",
        (qb) =>
          qb
            .andWhere("userEvent.status = :status", {
              status: StatusEnum.Active,
            })
            .andWhere("userEvent.userId = :userId", {
              userId: user.id,
            })
      )
      .where("event.id = :eventId", { eventId })
      .andWhere("eventDocuments.status = :status", { status: StatusEnum.Active })
      .getOne();

    if (!events) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Organize the images array
    let images = events.eventDocuments || [];
    const mainImageIndex = images.findIndex(
      (img) => img.documentName === events.mainImage
    );

    if (mainImageIndex !== -1) {
      const mainImage = images.splice(mainImageIndex, 1)[0];
      images = [mainImage, ...images];
    }

    // Transform the result to rename eventDocuments to images
    const transformedEvent = {
      ...events,
      images,
    };

    // Remove the original property to clean up the result
    delete transformedEvent.eventDocuments;

    return transformedEvent;
  }

  async update(
    id: number,
    updateEventDto: UpdateEventDto,
    user: User,
    files: Image
  ): Promise<Event> {
    const { currentImages, categoryId } = updateEventDto;
    delete updateEventDto.currentImages;

    console.log(`updateEventDto: `,updateEventDto)

    const category = await this.categoryRepository.findOneBy({
      id: +categoryId,
    });

    if (!category) throw new NotFoundException("Category not found");

    const event = await this.eventRepository.preload({
      id,
      ...updateEventDto,
      category
    });

    if (!event) throw new NotFoundException("Event not found");

    event.user = user;

    Object.assign(event, updateEventDto);

    const updated = await this.eventRepository.save(event);

    if (files && Object.keys(files).length > 0) {

      await this.findAndUpdateEventDocumentByEvent(event.id, currentImages);

      await this.createEventDocuments(files, user, event);
    }

    delete updated.user;
    delete updated.category;
    return updated;
  }

  async findAndUpdateEventDocumentByEvent(eventId: number, currentImagesData: any) {
    const documentNames = [];

    if (currentImagesData) {
      const currentImages: EventImage[] = JSON.parse(currentImagesData);

      
      currentImages.forEach((current) => {
        documentNames.push(current.documentName);
      });
  
      console.log(`documentNames: `,documentNames)
    }
    
    
    const oldEventDocuments = await this.eventDocumentRepository.find({
      where: { status: StatusEnum.Active, event: { id: eventId}, documentName: Not(In(documentNames))  }
    });

    console.log(`oldEventDocuments: `,oldEventDocuments)

    for (const eventDocument of oldEventDocuments) {
      eventDocument.status = StatusEnum.Inactive;
      await this.eventDocumentRepository.save(eventDocument);
    }
  }

  async createEventDocuments(files: Image, user: User, event: Event) {
    const baseUrl = this.configService.get("BASE_URL");

    const eventDocuments = files.images.map((image) => {
      const url = `${baseUrl}${image.filename}`;
      return this.eventDocumentRepository.create({
        documentName: image.filename,
        documentUrl: url,
        user,
        event,
        status: StatusEnum.Active,
      });
    });

    await this.eventDocumentRepository.save(eventDocuments);
  }

  async remove(id: number): Promise<Boolean> {
    const event = await this.eventRepository.findOneBy({ id });

    if (!event) throw new NotFoundException("Event not found");

    event.status = StatusEnum.Inactive;

    await this.eventRepository.save(event);

    return true;
  }

  async registerUser(
    userEventDto: UserEventDto,
    user: User
  ): Promise<UserEvent> {
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
      status: UserEventStatusEnum.Active,
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
      where: {
        event: { id: eventId },
        user: { id: user.id },
        status: UserEventStatusEnum.Active,
      },
    });

    return userEvent > 0;
  }

  async validateUserEventRegistered(eventId: number, user: User): Promise<Boolean> {
    const userEvent = await this.userEventRepository.count({
      where: {
        event: { id: eventId },
        user: { id: user.id },
      },
    });

    return userEvent > 0;
  }

  async updateEnroll(
    id: number,
    updateEventDto: UpdateUserEventDto,
    user: User
  ): Promise<UserEvent> {
    let userEvent: UserEvent;

    const event = await this.eventRepository.findOneBy({ id: id });
    if (!event) {
      throw new NotFoundException(`Event not found`);
    }

    const isUserEventRegistered = await this.validateUserEventRegistered(id, user);
    if (!isUserEventRegistered) {
      userEvent = await this.createUserEvent(event, user);
    } else {
      userEvent = await this.updateUserEvent(event, updateEventDto, user);
    }
    
    return userEvent;
  }

  async createUserEvent(event: Event, user: User): Promise<UserEvent> {
    const userEvent = this.userEventRepository.create({
      event,
      user,
      status: UserEventStatusEnum.Active,
    });

    await this.userEventRepository.save(userEvent);

    delete userEvent.createdAt;
    delete userEvent.updatedAt;
    delete userEvent.event;
    delete userEvent.user;

    return userEvent;
  }

  async updateUserEvent(event: Event, updateEventDto: UpdateUserEventDto, user: User): Promise<UserEvent> {
    const userEvent = await this.userEventRepository.findOne({
      where: {
        event: { id: event.id },
        user: { id: user.id },
      },
    });

    Object.assign(userEvent, updateEventDto);

    const updated = await this.userEventRepository.save(userEvent);

    delete updated.createdAt;
    delete updated.updatedAt;
    delete updated.event;
    delete updated.user;
    return updated;
  }

  async getTotalHoursAcumulated(user: User) {
    const { date } = this.getCurrentDate();
    const userEvent = await this.userEventRepository
      .createQueryBuilder("userEvent")
      .leftJoinAndSelect("userEvent.event", "event")
      .where("userEvent.userId = :userId", { userId: user.id })
      .andWhere("userEvent.status = :status", { status: StatusEnum.Active })
      .andWhere("userEvent.attended = :attended", { attended: true })
      .andWhere("event.date <= :date", { date })
      .getMany();

    const total = this.calculateTotalHours(userEvent);

    return total;
  }

  getCurrentDate(): { date: string } {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    return { date: formattedDate };
  }

  calculateTotalHours(userEvents: UserEvent[]): number {
    let total: number = 0;
    userEvents.forEach((userEvent) => {
      const { event } = userEvent;
      if (event.allDay) {
        total = total + 8;
        return;
      }

      total = total + Number(event.duration);
    });

    return total;
  }

  async publishEvent(id: number): Promise<Event> {
    
    const event = await this.eventRepository.findOne({ where: { id } });

    if (!event) throw new NotFoundException("Event not found");

    event.published = !event.published;

    const updated = await this.eventRepository.save(event);

    delete updated.user;
    delete updated.category;

    return updated;
  }

  async getAllUsersByEventId(id: number): Promise<User[]> {
    const eventId = id;

    const events = await this.eventRepository
    .createQueryBuilder("event")
    .leftJoin("event.userEvents", "userEvents", "userEvents.status = :status", { status: StatusEnum.Active })
    .leftJoinAndSelect("userEvents.user", "user")
    .where("event.id = :eventId", { eventId })
    .select([
      "event.id",
      "userEvents.id",
      "user.id",
      "user.name",
    ])
    .getOne();

    if (!events) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Transform the result to rename userEvents to users
    const users = events.userEvents.map(userEvent => userEvent.user);

    return users;
  }

  async updateAttendedUser(
    id: number,
    updateAttendedUser: UpdateAttendedUser
  ): Promise<UserEvent> {
    const { userId, attended } = updateAttendedUser;

    const userEvent = await this.userEventRepository.findOne({
      where: {
        event: { id: id },
        user: { id: userId },
      },
    });

    if (!userEvent) {
      throw new NotFoundException(`User or Event not found`);
    }

    userEvent.attended = attended;

    const updated = await this.userEventRepository.save(userEvent);

    delete updated.createdAt;
    delete updated.updatedAt;
    delete updated.event;
    delete updated.user;
    delete updated.notes;
    return updated;
  }
}
