import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Public()
  @Post('forgot-password/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() body: { targetType: 'EMAIL' | 'MOBILE'; credential: string; recoveryMode: 'USERNAME' | 'PASSWORD' }) {
    return this.authService.requestOtp(body);
  }

  @Public()
  @Post('forgot-password/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: { credential: string; otp: string; recoveryMode: 'USERNAME' | 'PASSWORD' }) {
    return this.authService.verifyOtp(body);
  }

  @Public()
  @Post('forgot-password/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { resetToken: string; newPassword: string }) {
    return this.authService.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin-test')
  async adminTest() {
    return { message: 'Welcome, Admin! Auth and Role guard are working correctly.' };
  }
}
