import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Query,
} from "@nestjs/common";
import { EventsService } from "./events.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import { RolesEnum } from "src/common/enums/roles.enum";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { User } from "src/auth/entities/user.entity";
import { Event } from "./entities/event.entity";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ResponseDto } from "src/common/dto/response.dto";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { FileValidationPipe } from "src/common/pipes/file-validation.pipe";
import { Image } from "./dto/imageName.dto";
import { UserEventDto } from "./dto/user-event.dto";
import { UserEvent } from "./entities/user-event.entity";
import { diskStorage } from "multer";
import * as path from 'path';
import { PaginationDto } from "src/common/dto/pagination.dto";
import { UpdateUserEventDto } from "./dto/update-user-event.dto";
import { UpdateAttendedUser } from "./dto/update-attended-user.dto";

@Auth()
@ApiBearerAuth()
@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth(RolesEnum.Admin)
  @ApiOperation({ summary: "Create event" })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateEventDto })
  @UseInterceptors(FileFieldsInterceptor([{ name: "images" }], {
    storage: diskStorage({
      destination: 'public/img',
      filename: (req, file, cb) => {
        console.log(`file before: `,file)
        const user = req.user as User;
        const userId = user.id;
        const timestamp = Date.now();
        const ext = file.mimetype.split('/')[1];
        const newFilename = `${userId}_${timestamp}.${ext}`;
        if (file.originalname == req.body.mainImage) {
          req.body.mainImage = newFilename
        }        
        cb(null, newFilename);
      },
    }),
  }))
  async create(
    @Body() createEventDto: CreateEventDto,
    @GetUser() user: User,
    @UploadedFiles(new FileValidationPipe()) files: Image
  ): Promise<ResponseDto<Event>> {
    const event = await this.eventsService.create(createEventDto, user, files);

    return new ResponseDto(
      HttpStatus.OK,
      "Events retrieved successfully",
      event,
      true
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Find all event" })
  @ApiResponse({ status: HttpStatus.OK, isArray: true, type: CreateEventDto })
  async findAll(@Query() paginationDto: PaginationDto, @GetUser() user: User): Promise<ResponseDto<Event[]>> {
    const events = await this.eventsService.findAll(paginationDto, user);

    return new ResponseDto(
      HttpStatus.OK,
      "Events retrieved successfully",
      events,
      true
    );
  }

  @Get("total-hours")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Find the total hours the user has accumulated" })
  @ApiResponse({ status: HttpStatus.OK, isArray: false, type: Number })
  async getTotalHoursAcumulated(@GetUser() user: User) {
    const hours = await this.eventsService.getTotalHoursAcumulated(user);

    return new ResponseDto(
      HttpStatus.OK,
      "Total hours retrieved successfully",
      hours,
      true
    );
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Find event by id" })
  @ApiResponse({ status: HttpStatus.OK, isArray: false, type: CreateEventDto })
  async findOne(@Param("id") id: string, @GetUser() user: User): Promise<ResponseDto<Event>> {
    const event = await this.eventsService.findOne(+id, user);

    return new ResponseDto(
      HttpStatus.OK,
      "Event retrieved successfully",
      event,
      true
    );
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update event" })
  @Auth(RolesEnum.Admin)
  @UseInterceptors(FileFieldsInterceptor([{ name: "images" }], {
    storage: diskStorage({
      destination: 'public/img',
      filename: (req, file, cb) => {
        const user = req.user as User;
        const userId = user.id;
        const timestamp = Date.now();
        const ext = file.mimetype.split('/')[1];
        console.log(req.body)
        console.log(`req.body.mainImage: `,req.body.mainImage)
        console.log(`file: `,file)
        console.log(`ext: `,ext)
        const newFilename = `${userId}_${timestamp}.${ext}`;
        if (file.originalname == req.body.mainImage) {
          req.body.mainImage = newFilename
        }        
        cb(null, newFilename);
      },
    }),
  }))
  async update(
    @Param("id") id: string,
    @Body() updateEventDto: UpdateEventDto,
    @GetUser() user: User,
    @UploadedFiles(new FileValidationPipe()) files: Image
  ): Promise<ResponseDto<Event>> {
    console.log(`files: `,files);
    const eventUpdated = await this.eventsService.update(+id, updateEventDto, user, files);

    return new ResponseDto(HttpStatus.OK, "Event updated", eventUpdated, true);
  }

  @Patch("publish/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update event" })
  @Auth(RolesEnum.Admin)
  async publishEvent(@Param("id") id: string): Promise<ResponseDto<Event>> {
    const eventUpdated = await this.eventsService.publishEvent(+id);

    return new ResponseDto(HttpStatus.OK, "Event updated", eventUpdated, true);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete event" })
  @ApiResponse({ status: HttpStatus.OK, isArray: false })
  @Auth(RolesEnum.Admin)
  async remove(@Param("id") id: string): Promise<ResponseDto<Boolean>> {
    const removed = await this.eventsService.remove(+id);

    return new ResponseDto(HttpStatus.OK, "Event removed", removed, true);
  }

  @Post("enroll")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Enroll user for an event" })
  @ApiResponse({ status: HttpStatus.CREATED, type: UserEventDto })
  async registerUser(
    @Body() userEventDto: UserEventDto,
    @GetUser() user: User
  ): Promise<ResponseDto<UserEvent>> {
    const result = await this.eventsService.registerUser(userEventDto, user);

    return new ResponseDto(HttpStatus.OK, "User registered for the event", result, true);
  }

  @Patch("enroll/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update enroll user for an event" })
  // @Auth(RolesEnum.Admin)
  async updateEnroll(
    @Param("id") id: string,
    @Body() updateEventDto: UpdateUserEventDto,
    @GetUser() user: User
  ): Promise<ResponseDto<UserEvent>> {
    const eventUpdated = await this.eventsService.updateEnroll(
      +id,
      updateEventDto,
      user
    );

    return new ResponseDto(HttpStatus.OK, "Enroll updated", eventUpdated, true);
  }

  getFileExtension(file: any): string {
    const mimeType = file.mimetype;
    const extension = mimeType.split('/')[1];
    
    return extension;
  }

  
  @Get(":id/users")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Find all users by event" })
  @Auth(RolesEnum.Admin)
  async getAllUsersByEventId(@Param("id") id: string): Promise<ResponseDto<User[]>> {
    const users = await this.eventsService.getAllUsersByEventId(+id);

    return new ResponseDto(HttpStatus.OK, "Users by event retrieved successfully", users, true);
  }

  @Patch(":id/user/attended")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update attended user an event" })
  @Auth(RolesEnum.Admin)
  async updateAttendedUser(
    @Param("id") id: string,
    @Body() updateAttendedUser: UpdateAttendedUser): Promise<ResponseDto<UserEvent>> {
    const users = await this.eventsService.updateAttendedUser(+id, updateAttendedUser);

    return new ResponseDto(HttpStatus.OK, "Attended updated", users, true);
  }
  
}
