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
  ParseFilePipeBuilder,
  UsePipes,
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
  @UseInterceptors(FileFieldsInterceptor([{ name: "images" }]))
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
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: true,
    type: CreateEventDto,
  })
  @Auth(RolesEnum.Admin)
  async findAll(): Promise<ResponseDto<Event[]>> {
    const events = await this.eventsService.findAll();

    return new ResponseDto(
      HttpStatus.OK,
      "Events retrieved successfully",
      events,
      true
    );
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Find event by id" })
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: false,
    type: CreateEventDto,
  })
  async findOne(@Param("id") id: string): Promise<ResponseDto<Event>> {
    const event = await this.eventsService.findOne(+id);

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
  async update(
    @Param("id") id: string,
    @Body() updateEventDto: UpdateEventDto,
    @GetUser() user: User
  ): Promise<ResponseDto<Event>> {
    const eventUpdated = await this.eventsService.update(
      +id,
      updateEventDto,
      user
    );

    return new ResponseDto(HttpStatus.OK, "Event updated", eventUpdated, true);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete event" })
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: false,
  })
  async remove(@Param("id") id: string): Promise<ResponseDto<Boolean>> {
    const removed = await this.eventsService.remove(+id);

    return new ResponseDto(HttpStatus.OK, "Event removed", removed, true);
  }
}
