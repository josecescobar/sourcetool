import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@sourcetool/db';
import { EmailService } from '../email/email.service';
import { generateToken, hashToken } from './utils/token.util';
import { ApiError } from '../http';
import { comparePassword, generateTokens, hashPassword, verifyRefreshToken } from './jwt';
import { runAfter } from '../after';

export class AuthService {
  private googleClient: OAuth2Client;

  constructor(private emailService: EmailService) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(email: string, password: string, name?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, 'Email already registered');

    const passwordHash = await hashPassword(password);
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

    runAfter(() => this.sendVerificationEmail(email));

    return generateTokens(user.id, email, team.id);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) throw new ApiError(401, 'Invalid credentials');

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) throw new ApiError(401, 'Invalid credentials');

    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
    });

    return generateTokens(user.id, email, membership?.teamId);
  }

  async refreshToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    return generateTokens(payload.sub, payload.email, payload.teamId);
  }

  async googleAuth(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    }).catch(() => {
      throw new ApiError(401, 'Invalid Google credential');
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new ApiError(401, 'Invalid Google credential');
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const avatarUrl = payload.picture;

    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl, emailVerified: true },
        });
      } else {
        user = await prisma.user.create({
          data: { email, googleId, name, avatarUrl, emailVerified: true },
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

    return generateTokens(user.id, email, membership?.teamId);
  }

  async getProfile(userId: string): Promise<any> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, avatarUrl: true,
        emailVerified: true, googleId: true,
        createdAt: true, teamMembers: {
          include: { team: { include: { subscription: true } } },
        },
      },
    });
  }

  // ─── Email Verification ──────────────────────────────────────────

  async sendVerificationEmail(email: string) {
    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, type: 'EMAIL_VERIFICATION' },
    });

    const rawToken = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(rawToken),
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await this.emailService.sendVerificationEmail(email, rawToken);
  }

  async verifyEmail(email: string, token: string) {
    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashToken(token),
        type: 'EMAIL_VERIFICATION',
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) throw new ApiError(400, 'Invalid or expired verification token');

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: email, type: 'EMAIL_VERIFICATION' },
    });

    return { message: 'Email verified successfully' };
  }

  // ─── Password Reset ──────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return generic message to prevent email enumeration
    if (!user) return { message: 'If an account exists, a reset email has been sent' };

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, type: 'PASSWORD_RESET' },
    });

    const rawToken = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(rawToken),
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await this.emailService.sendPasswordResetEmail(email, rawToken);

    return { message: 'If an account exists, a reset email has been sent' };
  }

  async resetPassword(email: string, token: string, password: string) {
    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashToken(token),
        type: 'PASSWORD_RESET',
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) throw new ApiError(400, 'Invalid or expired reset token');

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { email },
      data: { passwordHash, emailVerified: true },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: email, type: 'PASSWORD_RESET' },
    });

    return { message: 'Password reset successfully' };
  }
}
