import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
  async google(@Body() body: { credential: string }) {
    return { success: true, data: await this.authService.googleAuth(body.credential) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('id') userId: string): Promise<any> {
    return { success: true, data: await this.authService.getProfile(userId) };
  }

  // ─── Email Verification ────────────────────────────────────────

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; token: string }) {
    return { success: true, data: await this.authService.verifyEmail(body.email, body.token) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  async resendVerification(@CurrentUser('email') email: string) {
    await this.authService.sendVerificationEmail(email);
    return { success: true, data: { message: 'Verification email sent' } };
  }

  // ─── Password Reset ───────────────────────────────────────────

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return { success: true, data: await this.authService.forgotPassword(body.email) };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; token: string; password: string }) {
    return { success: true, data: await this.authService.resetPassword(body.email, body.token, body.password) };
  }
}
