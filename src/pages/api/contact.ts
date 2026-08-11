import type { APIRoute } from 'astro';

import {
  contactRequestSchema,
  getContactFieldErrors,
} from '../../lib/contact-schema';
import {
  checkContactRateLimit,
  getContactClientKey,
} from '../../lib/contact-rate-limit';
import { MailConfigurationError, sendContactEmail } from '../../lib/mailer';

export const prerender = false;

const MAX_BODY_BYTES = 16 * 1024;

type JsonBody = Record<string, unknown>;

function jsonResponse(body: unknown, status: number, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');

  if (fetchSite === 'cross-site') return false;

  const origin = request.headers.get('origin');

  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const forwardedProtocol = request.headers
      .get('x-forwarded-proto')
      ?.split(',')[0]
      ?.trim()
      .toLowerCase();
    const requestHost = forwardedHost || request.headers.get('host') || requestUrl.host;
    const requestProtocol =
      forwardedProtocol === 'http' || forwardedProtocol === 'https'
        ? `${forwardedProtocol}:`
        : requestUrl.protocol;

    return (
      originUrl.host.toLowerCase() === requestHost.toLowerCase() &&
      originUrl.protocol === requestProtocol
    );
  } catch {
    return false;
  }
}

async function parseRequestBody(request: Request): Promise<JsonBody> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);

  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new Error('BODY_TOO_LARGE');
  }

  const rawBody = await request.text();

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    throw new Error('BODY_TOO_LARGE');
  }

  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim();

  if (contentType === 'application/json') {
    const parsed = JSON.parse(rawBody) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('INVALID_BODY');
    }

    return parsed as JsonBody;
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  throw new Error('UNSUPPORTED_MEDIA_TYPE');
}

export const POST: APIRoute = async ({ request }) => {
  const requestId = crypto.randomUUID();

  if (!isSameOriginRequest(request)) {
    return jsonResponse(
      { success: false, error: { code: 'FORBIDDEN', requestId } },
      403,
    );
  }

  const rateLimit = checkContactRateLimit(getContactClientKey(request));

  if (!rateLimit.allowed) {
    return jsonResponse(
      { success: false, error: { code: 'RATE_LIMITED', requestId } },
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) },
    );
  }

  let body: JsonBody;

  try {
    body = await parseRequestBody(request);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INVALID_BODY';
    const status = code === 'BODY_TOO_LARGE' ? 413 : code === 'UNSUPPORTED_MEDIA_TYPE' ? 415 : 400;

    return jsonResponse({ success: false, error: { code, requestId } }, status);
  }

  // Silently accept honeypot submissions so bots cannot adapt to the trap.
  if (typeof body.company === 'string' && body.company.trim().length > 0) {
    return jsonResponse({ success: true, requestId }, 200);
  }

  const parsed = contactRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          fields: getContactFieldErrors(parsed.error),
          requestId,
        },
      },
      422,
    );
  }

  try {
    await sendContactEmail(parsed.data);

    return jsonResponse({ success: true, requestId }, 200);
  } catch (error) {
    if (error instanceof MailConfigurationError) {
      console.error('[contact] SMTP credentials are not configured.', { requestId });

      return jsonResponse(
        { success: false, error: { code: 'MAIL_NOT_CONFIGURED', requestId } },
        503,
      );
    }

    const smtpError = error as { code?: string; command?: string };

    console.error('[contact] SMTP delivery failed.', {
      requestId,
      code: smtpError.code ?? 'UNKNOWN',
      command: smtpError.command ?? 'UNKNOWN',
    });

    return jsonResponse(
      { success: false, error: { code: 'DELIVERY_FAILED', requestId } },
      502,
    );
  }
};
