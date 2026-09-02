import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { authService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const body = await readJson<{ email: string; password: string }>(req);
  return jsonOk(await authService.login(body.email, body.password));
});
