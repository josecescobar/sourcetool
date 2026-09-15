import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { authService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const body = await readJson<{ email: string; password: string; name?: string }>(req);
  return jsonOk(await authService.register(body.email, body.password, body.name));
});
