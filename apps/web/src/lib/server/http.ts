import { NextResponse } from 'next/server';

export type PlanLimitBody = {
  error: 'Plan limit reached';
  feature: string;
  limit: number;
  current: number;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, options?: { code?: string; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code ?? 'ERROR';
    this.details = options?.details;
  }
}

export class PlanLimitError extends ApiError {
  body: PlanLimitBody;

  constructor(body: PlanLimitBody) {
    super(403, 'Plan limit reached', { code: 'Plan limit reached', details: body });
    this.body = body;
  }
}

export function jsonOk(data: unknown, init?: { status?: number; extra?: Record<string, unknown> }) {
  return NextResponse.json(
    { success: true, data, ...(init?.extra ?? {}) },
    { status: init?.status ?? 200 },
  );
}

export function jsonError(err: unknown) {
  if (err instanceof PlanLimitError) {
    return NextResponse.json(err.body, { status: 403 });
  }

  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      { status: err.status },
    );
  }

  // Unexpected error: log the real cause server-side, but never return it to the
  // client — messages from Prisma, third-party SDKs, etc. can leak internals.
  console.error('[api]', err);
  return NextResponse.json(
    {
      success: false,
      error: { code: 'ERROR', message: 'Internal server error' },
    },
    { status: 500 },
  );
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }
}

export function isAllowedOrigin(origin: string | null) {
  // No Origin header (same-origin navigation, curl, server-to-server) needs no
  // CORS grant, so it is not an "allowed origin" to reflect — previously this
  // returned true, which is a confusing default. Only the app's own origin and
  // browser extensions (whose ids are not known at build time) are allowed.
  if (!origin) return false;
  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  return (
    origin === webUrl ||
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('moz-extension://') ||
    origin.startsWith('safari-web-extension://')
  );
}

function applyCors(req: Request, response: Response) {
  const origin = req.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

export function corsPreflightResponse(req: Request) {
  const origin = req.headers.get('origin');
  const allowed = isAllowedOrigin(origin);
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

export function handleRoute(fn: (req: Request, ctx?: any) => Promise<NextResponse | Response>) {
  return async (req: Request, ctx?: any) => {
    // App Router does not invoke this for a real browser preflight unless the
    // route exports OPTIONS. middleware.ts answers /api OPTIONS first; this
    // branch covers direct calls (tests, and any route that re-exports it).
    if (req.method === 'OPTIONS') {
      return corsPreflightResponse(req);
    }
    try {
      return applyCors(req, await fn(req, ctx));
    } catch (err) {
      return applyCors(req, jsonError(err));
    }
  };
}
