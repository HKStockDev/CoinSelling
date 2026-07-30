import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentUser, Public } from '../common/decorators';
import { AuthUser } from '../common/types';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  fullName!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.fullName);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() body: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, body.fullName);
  }
}
