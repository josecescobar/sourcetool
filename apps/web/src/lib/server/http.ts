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

  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[api]', err);
  return NextResponse.json(
    {
      success: false,
      error: { code: 'ERROR', message },
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

function applyCors(req: Request, response: Response) {
  const origin = req.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

function corsPreflight(req: Request) {
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
    if (req.method === 'OPTIONS') {
      return corsPreflight(req);
    }
    try {
      return applyCors(req, await fn(req, ctx));
    } catch (err) {
      return applyCors(req, jsonError(err));
    }
  };
}
