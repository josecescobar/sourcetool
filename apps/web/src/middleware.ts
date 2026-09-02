import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;
  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  return (
    origin === webUrl ||
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('moz-extension://') ||
    origin.startsWith('safari-web-extension://')
  );
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowed = isAllowedOrigin(origin);

  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    if (allowed && origin) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
      headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type,Stripe-Signature');
      headers.set('Access-Control-Max-Age', '86400');
      headers.set('Vary', 'Origin');
    }
    return new NextResponse(null, { status: allowed ? 204 : 403, headers });
  }

  const response = NextResponse.next();
  if (allowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
