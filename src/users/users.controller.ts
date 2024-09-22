import { Controller, Get, Body, Patch, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from 'src/auth/entities/user.entity';
import { ResponseDto } from 'src/common/dto/response.dto';
import { UserRole } from 'src/auth/entities/user-role.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';

@Auth()
@ApiBearerAuth()
@ApiTags("users")
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get all users" })
  @Auth(RolesEnum.Admin)
  async findAll(): Promise<ResponseDto<User[]>> {
    const users = await this.usersService.findAll();
    return new ResponseDto(HttpStatus.OK, "Users retrieved successfully", users, true);
  }

  @Patch('update-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update user role" })
  @Auth(RolesEnum.Admin)
  async updateUserRole(@Body() updateUserRoleDto: UpdateUserRoleDto): Promise<ResponseDto<UserRole>> {
    const user = await this.usersService.updateUserRole(updateUserRoleDto);

    return new ResponseDto(HttpStatus.OK, "User role updated successfully", user, true);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
}
