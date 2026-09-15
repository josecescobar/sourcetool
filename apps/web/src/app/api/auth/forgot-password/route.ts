import { rateLimitForgotPassword } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { authService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  rateLimitForgotPassword(ip);
  const body = await readJson<{ email: string }>(req);
  return jsonOk(await authService.forgotPassword(body.email));
});
