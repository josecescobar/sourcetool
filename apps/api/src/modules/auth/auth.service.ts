import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { prisma } from '@sourcetool/db';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    // Create default team
    const team = await prisma.team.create({
      data: {
        name: `${name || email}'s Team`,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: 'OWNER', joinedAt: new Date() },
        },
        subscription: {
          create: { planTier: 'FREE', status: 'ACTIVE' },
        },
      },
    });

    return this.generateTokens(user.id, email, team.id);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
    });

    return this.generateTokens(user.id, email, membership?.teamId);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      });
      return this.generateTokens(payload.sub, payload.email, payload.teamId);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async googleAuth(googleId: string, email: string, name?: string, avatarUrl?: string) {
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl },
        });
      } else {
        user = await prisma.user.create({
          data: { email, googleId, name, avatarUrl },
        });
        await prisma.team.create({
          data: {
            name: `${name || email}'s Team`,
            ownerId: user.id,
            members: {
              create: { userId: user.id, role: 'OWNER', joinedAt: new Date() },
            },
            subscription: {
              create: { planTier: 'FREE', status: 'ACTIVE' },
            },
          },
        });
      }
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
    });

    return this.generateTokens(user.id, email, membership?.teamId);
  }

  async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, avatarUrl: true,
        createdAt: true, teamMembers: {
          include: { team: { include: { subscription: true } } },
        },
      },
    });
  }

  private generateTokens(userId: string, email: string, teamId?: string) {
    const payload = { sub: userId, email, teamId };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
    });

    return { accessToken, refreshToken, userId, teamId };
  }
}
