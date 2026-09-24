import { NextResponse } from 'next/server';
import { corsPreflightResponse } from '@/lib/server/http';

/**
 * Browser preflight never reaches route handlers that only export GET/POST/etc.
 * Next.js then answers OPTIONS with 204 and no CORS headers, which blocks the
 * Chrome extension: its fetches send Content-Type and Authorization, so they
 * are not "simple" requests. Answer /api preflight here, before that fallback.
 */
export function middleware(req: Request) {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(req);
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
