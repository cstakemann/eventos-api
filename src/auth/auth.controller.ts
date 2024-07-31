import { Controller, Post, Body, HttpCode, HttpStatus, Get } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { Auth } from "./decorators/auth.decorator";
import { User } from "./entities/user.entity";
import { GetUser } from "./decorators/get-user.decorator";
import { RolesEnum } from "src/common/enums/roles.enum";
import { ApiExcludeController, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from "src/common/dto/response.dto";

@ApiTags('auth')
@ApiExcludeController()
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create user" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateUserDto
  })
  async create(@Body() createAuthDto: CreateUserDto) {
    const response = await this.authService.create(createAuthDto);

    return new ResponseDto(HttpStatus.OK, "User created successfully", response, true);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log in user" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LoginUserDto
  })
  async login(@Body() loginAuthDto: LoginUserDto) {
    const response = await this.authService.login(loginAuthDto);

    return new ResponseDto(HttpStatus.OK, "User logged in", response, true);
  }

  @Get("check")
  @HttpCode(HttpStatus.OK)
  check() {
    return HttpStatus.OK
  }
}
