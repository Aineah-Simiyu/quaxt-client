import { NextResponse } from 'next/server';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function sanitizeSetCookieHeader(setCookieArray, host) {
  if (!setCookieArray || setCookieArray.length === 0) return [];
  return setCookieArray.map((cookieStr) => {
    // Remove Domain attribute so cookie is set for current host
    return cookieStr
      .replace(/;\s*Domain=[^;]*/i, '')
      // Ensure Secure/HttpOnly/SameSite are preserved as sent by backend
      .trim();
  });
}

async function handleProxy(req, { params }) {
  const targetBase = process.env.API_PROXY_TARGET || 'https://api.quaxt.co.ke';
  const { search } = new URL(req.url);
  const path = Array.isArray(params?.path) ? params.path.join('/') : '';
  const backendUrl = `${targetBase.replace(/\/$/, '')}/api/${path}${search}`;

  const method = req.method;

  // Clone headers and drop hop-by-hop and host headers
  const outboundHeaders = new Headers(req.headers);
  outboundHeaders.delete('host');
  outboundHeaders.delete('content-length');
  for (const h of HOP_BY_HOP_HEADERS) outboundHeaders.delete(h);

  const init = {
    method,
    headers: outboundHeaders,
    // Only pass body for non-GET/HEAD
    body: method === 'GET' || method === 'HEAD' ? undefined : req.body,
    redirect: 'manual',
  };

  const backendRes = await fetch(backendUrl, init);

  // Prepare response
  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      // Skip content-length; Next will set appropriately
      if (key.toLowerCase() !== 'content-length' && key.toLowerCase() !== 'set-cookie') {
        resHeaders.set(key, value);
      }
    }
  });

  // Handle Set-Cookie header(s): rewrite Domain to current host (by removing Domain)
  const setCookie = backendRes.headers.getSetCookie?.() || backendRes.headers.get('set-cookie');
  const setCookies = Array.isArray(setCookie)
    ? setCookie
    : (setCookie ? [setCookie] : []);
  const sanitizedCookies = sanitizeSetCookieHeader(setCookies);

  const body = backendRes.body;
  const response = new NextResponse(body, {
    status: backendRes.status,
    headers: resHeaders,
  });

  for (const c of sanitizedCookies) {
    response.headers.append('set-cookie', c);
  }

  return response;
}

export async function GET(req, ctx) {
  return handleProxy(req, ctx);
}
export async function POST(req, ctx) {
  return handleProxy(req, ctx);
}
export async function PUT(req, ctx) {
  return handleProxy(req, ctx);
}
export async function PATCH(req, ctx) {
  return handleProxy(req, ctx);
}
export async function DELETE(req, ctx) {
  return handleProxy(req, ctx);
}
export async function OPTIONS(req, ctx) {
  return handleProxy(req, ctx);
}
