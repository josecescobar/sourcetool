import { requireAuth } from '@/lib/server/auth/jwt';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { authService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const user = await requireAuth(req);
  return jsonOk(await authService.getProfile(user.id));
});
