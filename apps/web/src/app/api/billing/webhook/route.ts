import { NextResponse } from 'next/server';
import { handleRoute } from '@/lib/server/http';
import { billingService } from '@/lib/server/services';

export const POST = handleRoute(async (req) => {
  const signature = req.headers.get('stripe-signature') || '';
  const raw = Buffer.from(await req.arrayBuffer());
  await billingService.handleWebhook(raw, signature);
  return NextResponse.json({ received: true });
});
