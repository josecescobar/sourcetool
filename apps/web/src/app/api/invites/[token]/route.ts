import { handleRoute, jsonOk } from '@/lib/server/http';
import { teamsService } from '@/lib/server/services';

export const GET = handleRoute(async (_req, ctx: { params: Promise<{ token: string }> }) => {
  const { token } = await ctx.params;
  return jsonOk(await teamsService.getInviteInfo(token));
});
