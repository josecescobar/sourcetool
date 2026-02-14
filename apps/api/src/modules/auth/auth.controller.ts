import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name?: string }) {
    return { success: true, data: await this.authService.register(body.email, body.password, body.name) };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return { success: true, data: await this.authService.login(body.email, body.password) };
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return { success: true, data: await this.authService.refreshToken(body.refreshToken) };
  }

  @Post('google')
  async google(@Body() body: { googleId: string; email: string; name?: string; avatarUrl?: string }) {
    return { success: true, data: await this.authService.googleAuth(body.googleId, body.email, body.name, body.avatarUrl) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('id') userId: string): Promise<any> {
    return { success: true, data: await this.authService.getProfile(userId) };
  }
}
