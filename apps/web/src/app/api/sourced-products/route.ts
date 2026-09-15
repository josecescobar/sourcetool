import { NextResponse } from 'next/server';
import { requireTeamRole } from '@/lib/server/guards';
import { handleRoute, jsonOk, readJson } from '@/lib/server/http';
import { sourcedProductsService } from '@/lib/server/services';

export const GET = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 20;
  const result = await sourcedProductsService.getAll(teamId, page, limit);
  return NextResponse.json({ success: true, ...result });
});

export const POST = handleRoute(async (req) => {
  const { teamId } = await requireTeamRole(req, ['OWNER', 'ADMIN']);
  const body = await readJson<any>(req);
  return jsonOk(await sourcedProductsService.create(teamId, body));
});
