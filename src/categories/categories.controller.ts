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
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { Auth } from "src/auth/decorators/auth.decorator";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RolesEnum } from "src/common/enums/roles.enum";
import { ResponseDto } from "src/common/dto/response.dto";
import { Category } from "./entities/category.entity";

@Auth()
@ApiBearerAuth()
@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth(RolesEnum.Admin)
  @ApiOperation({ summary: "Create category" })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateCategoryDto })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<ResponseDto<Category>> {
    const category = await this.categoriesService.create(createCategoryDto);

    return new ResponseDto(
      HttpStatus.OK,
      "Categories retrieved successfully",
      category,
      true
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Find all categories" })
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: true,
    type: CreateCategoryDto,
  })
  async findAll(): Promise<ResponseDto<Category[]>> {
    const categories = await this.categoriesService.findAll();

    return new ResponseDto(
      HttpStatus.OK,
      "Categories retrieved successfully",
      categories,
      true
    );
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Find category by id" })
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: false,
    type: CreateCategoryDto,
  })
  async findOne(@Param("id") id: string): Promise<ResponseDto<Category>> {
    const category = await this.categoriesService.findOne(+id);

    return new ResponseDto(
      HttpStatus.OK,
      "Category retrieved successfully",
      category,
      true
    );
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: false,
    type: CreateCategoryDto,
  })
  @ApiOperation({ summary: "Update category" })
  async update(@Param("id") id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<ResponseDto<Category>> {
    const category = await this.categoriesService.update(+id, updateCategoryDto);
    return new ResponseDto(
      HttpStatus.OK,
      "Categories updated successfully",
      category,
      true
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete category" })
  @ApiResponse({
    status: HttpStatus.OK,
    isArray: false,
  })
  async remove(@Param("id") id: string): Promise<ResponseDto<Boolean>> {
    const removed = await this.categoriesService.remove(+id);

    return new ResponseDto(HttpStatus.OK, "Category removed", removed, true);
  }
}
