import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { EventsService } from "./events.service";
import { EventsController } from "./events.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Event } from "./entities/event.entity";
import { UserEvent } from "./entities/user-event.entity";
import { EventDocument } from "./entities/event-documents.entity";
import { PassportModule } from "@nestjs/passport";
import { CategoriesModule } from "src/categories/categories.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  controllers: [EventsController],
  providers: [EventsService],
  imports: [
    ConfigModule,
    CategoriesModule,
    TypeOrmModule.forFeature([Event, UserEvent, EventDocument]),
    PassportModule.register({
      defaultStrategy: "jwt",
    }),
  ],
  exports: [TypeOrmModule],
})
export class EventsModule {}
