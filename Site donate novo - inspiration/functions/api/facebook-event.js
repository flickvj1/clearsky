/**
 * Good Green Foundation — Facebook Conversions API (server-side)
 * ---------------------------------------------------------------
 * Cloudflare Pages Function
 * POST /api/facebook-event
 *
 * Env vars — configure em:
 * Cloudflare Dashboard → Pages → seu projeto → Settings → Environment variables
 *
 *   FB_ACCESS_TOKEN  = <seu token>
 *   FB_TEST_CODE     = <TEST12345>  (opcional — apenas para testes)
 */

const PIXEL_ID = '1607510407218328';

const ALLOWED_ORIGINS = [
  'https://goodgreenfoundation.com',
  'https://www.goodgreenfoundation.com',
  'https://divine-glade-d2b1.pages.dev',
];

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

// SHA-256 via Web Crypto (Workers runtime)
async function sha256(value) {
  if (!value) return undefined;
  const data = new TextEncoder().encode(String(value).trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Normaliza telefone para E.164
function normalizePhone(phone) {
  if (!phone) return null;
  let p = String(phone).trim().replace(/[\s\-().]/g, '');
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

export async function onRequest({ request, env }) {
  const origin = request.headers.get('Origin') || '';

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: getCorsHeaders(origin) });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { ...getCorsHeaders(origin), Allow: 'POST, OPTIONS' }
    });
  }

  // Validação de origem
  const referer = request.headers.get('Referer') || '';
  const originOk = ALLOWED_ORIGINS.includes(origin);
  const refOk    = ALLOWED_ORIGINS.some(o => referer.startsWith(o));
  if (!originOk && !refOk) {
    console.warn('[FB] Blocked origin:', origin, 'referer:', referer);
    return new Response(null, { status: 403 });
  }

  const ACCESS_TOKEN = env.FB_ACCESS_TOKEN;
  const TEST_CODE    = env.FB_TEST_CODE;

  if (!ACCESS_TOKEN) {
    console.error('[FB] FB_ACCESS_TOKEN not configured');
    return json({ ok: false, reason: 'token_missing' }, 200, origin);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'invalid JSON' }, 400, origin); }

  const {
    event_name,
    event_id,
    url,
    referrer,
    user_agent,
    email,
    phone,
    first_name,
    last_name,
    external_id,
    fbc,
    fbp,
    custom_data = {}
  } = body;

  if (!event_name) return json({ error: 'event_name is required' }, 400, origin);

  // IP real via Cloudflare
  const ip = request.headers.get('CF-Connecting-IP')
           || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
           || '';

  // PII → SHA-256
  const [
    hashedEmail,
    hashedPhone,
    hashedFirstName,
    hashedLastName,
    hashedExternalId
  ] = await Promise.all([
    sha256(email),
    sha256(normalizePhone(phone)),
    sha256(first_name),
    sha256(last_name),
    sha256(external_id)
  ]);

  // user_data
  const user_data = {};
  if (ip)               user_data.client_ip_address = ip;
  if (user_agent)       user_data.client_user_agent = user_agent;
  if (fbc)              user_data.fbc               = fbc;
  if (fbp)              user_data.fbp               = fbp;
  if (hashedEmail)      user_data.em                = hashedEmail;
  if (hashedPhone)      user_data.ph                = hashedPhone;
  if (hashedFirstName)  user_data.fn                = hashedFirstName;
  if (hashedLastName)   user_data.ln                = hashedLastName;
  if (hashedExternalId) user_data.external_id       = hashedExternalId;

  const eventPayload = {
    event_name,
    event_time:   Math.floor(Date.now() / 1000),
    event_id:     event_id || `${event_name}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    event_source_url: url || '',
    action_source:    'website',
    user_data,
  };

  // custom_data (valor, moeda, etc.)
  const cd = {};
  if (custom_data.value    !== undefined) cd.value    = Number(custom_data.value);
  if (custom_data.currency)               cd.currency = custom_data.currency;
  if (custom_data.content_name)           cd.content_name = custom_data.content_name;
  if (custom_data.content_ids)            cd.content_ids  = custom_data.content_ids;
  if (custom_data.content_type)           cd.content_type = custom_data.content_type;
  if (Object.keys(cd).length)            eventPayload.custom_data = cd;

  const payload = { data: [eventPayload] };
  if (TEST_CODE) payload.test_event_code = TEST_CODE;

  try {
    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      }
    );

    const result = await fbRes.json();

    if (result.error) {
      console.error('[FB] API error:', JSON.stringify(result.error));
    } else {
      console.log('[FB] Event sent:', event_name, '| events_received:', result.events_received);
    }

    return json({ ok: !result.error, result }, 200, origin);

  } catch (err) {
    console.error('[FB] Fetch error:', err.message);
    return json({ ok: false, reason: 'fetch_error' }, 200, origin);
  }
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
  });
}
