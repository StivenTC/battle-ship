import type { AuthResponseDto, LoginDto, RegisterDto } from "@battle-ship/shared";
import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import type { UsersService } from "../users/users.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create(dto.username, dto.password);
    return {
      token: user.id, // Simplified token
      user: user,
    };
  }

  @Post("login")
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      token: user.id,
      user: user,
    };
  }
}
