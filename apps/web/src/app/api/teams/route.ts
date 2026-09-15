import { requireAuth } from '@/lib/server/auth/jwt';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { teamsService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const user = await requireAuth(req);
  const body = await readJson<{ name: string }>(req);
  return jsonOk(await teamsService.create(body.name, user.id));
});
