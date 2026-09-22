import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string comparison. Both inputs are hashed to a fixed-length
 * digest first, so neither the contents nor the length of the secret leak
 * through comparison timing.
 */
function safeEqual(a: string, b: string): boolean {
  const ah = createHash('sha256').update(a).digest();
  const bh = createHash('sha256').update(b).digest();
  return timingSafeEqual(ah, bh);
}

/** Validate the `Authorization: Bearer <CRON_SECRET>` header in constant time. */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  if (!auth) return false;
  return safeEqual(auth, `Bearer ${secret}`);
}
