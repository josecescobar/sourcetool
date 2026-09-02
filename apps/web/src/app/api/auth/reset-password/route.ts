import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { authService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const body = await readJson<{ email: string; token: string; password: string }>(req);
  return jsonOk(await authService.resetPassword(body.email, body.token, body.password));
});
