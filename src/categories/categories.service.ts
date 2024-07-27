import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { Category } from "./entities/category.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { StatusEnum } from "src/common/enums/status.enum";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { status: StatusEnum.Active },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto
  ): Promise<Category> {
    const category = await this.categoryRepository.preload({
      id: +id,
      ...updateCategoryDto,
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<Boolean> {
    const category = await this.findOne(id);
    if (!category) throw new NotFoundException("Category not found");

    category.status = StatusEnum.Inactive;

    await this.categoryRepository.save(category);

    return true;
  }
}
