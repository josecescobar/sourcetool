import { requireAuth } from '@/lib/server/auth/jwt';
import { handleRoute, jsonOk } from '@/lib/server/http';
import { teamsService } from '@/lib/server/services';

export const POST = handleRoute(async (req, ctx: { params: Promise<{ token: string }> }) => {
  const user = await requireAuth(req);
  const { token } = await ctx.params;
  return jsonOk(await teamsService.acceptInvite(token, user.id));
});
