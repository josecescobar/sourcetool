import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { authService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const body = await readJson<{ credential: string }>(req);
  return jsonOk(await authService.googleAuth(body.credential));
});
