import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '@sourcetool/db';
import { ApiError } from '../http';

export type JwtPayload = {
  sub: string;
  email: string;
  teamId?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  teamId?: string;
};

function jwtSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-me';
}

function jwtRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
}

function accessExpiry(): SignOptions['expiresIn'] {
  return (process.env.JWT_ACCESS_EXPIRY || '15m') as SignOptions['expiresIn'];
}

function refreshExpiry(): SignOptions['expiresIn'] {
  return (process.env.JWT_REFRESH_EXPIRY || '7d') as SignOptions['expiresIn'];
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: accessExpiry() });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, jwtRefreshSecret(), { expiresIn: refreshExpiry() });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, jwtSecret()) as JwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, jwtRefreshSecret()) as JwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }
}

export function generateTokens(userId: string, email: string, teamId?: string) {
  const payload: JwtPayload = { sub: userId, email, teamId };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    userId,
    teamId,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function requireAuth(req: Request): Promise<AuthUser> {
  const token = extractBearerToken(req);
  if (!token) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  return { id: user.id, email: user.email, teamId: payload.teamId };
}
