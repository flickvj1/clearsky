/**
 * Good Green Foundation — TikTok Events API (server-side)
 * --------------------------------------------------------
 * Cloudflare Pages Function
 * POST /api/tiktok-event
 *
 * Estrutura do payload segue a spec oficial TikTok Events API v1.3:
 * https://business-api.tiktok.com/open_api/v1.3/event/track/
 *
 * Env vars — configure em:
 * Cloudflare Dashboard → Pages → seu projeto → Settings → Environment variables
 *
 *   TIKTOK_ACCESS_TOKEN  = <seu token>
 */

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

const PIXEL_ID = 'D7DTPB3C77UDSGCE1MJG';

// SHA-256 via Web Crypto API (Workers runtime — sem Node.js)
async function sha256(value) {
  if (!value) return undefined;
  const encoder = new TextEncoder();
  const data    = encoder.encode(String(value).trim().toLowerCase());
  const hash    = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Normaliza telefone para E.164 antes de hashar (exigido pelo TikTok)
function normalizePhone(phone) {
  if (!phone) return null;
  let p = String(phone).trim().replace(/[\s\-().]/g, '');
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

// ── Handler único — trata OPTIONS, POST e rejeita o resto ──────────────────
export async function onRequest({ request, env }) {
  const origin = request.headers.get('Origin') || '';

  // ── CORS preflight ─────────────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: getCorsHeaders(origin) });
  }

  // ── Apenas POST é aceito ────────────────────────────────────────────────
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { ...getCorsHeaders(origin), Allow: 'POST, OPTIONS' }
    });
  }

  // ── Validação de origem ─────────────────────────────────────────────────
  const referer  = request.headers.get('Referer') || '';
  const originOk = ALLOWED_ORIGINS.includes(origin);
  const refOk    = ALLOWED_ORIGINS.some(o => referer.startsWith(o));
  if (!originOk && !refOk) {
    console.warn('[TikTok] Blocked origin:', origin, 'referer:', referer);
    return new Response(null, { status: 403 });
  }

  const ACCESS_TOKEN = env.TIKTOK_ACCESS_TOKEN;
  const TEST_CODE    = env.TIKTOK_TEST_CODE;

  if (!ACCESS_TOKEN) {
    console.error('[TikTok] TIKTOK_ACCESS_TOKEN not configured');
    return json({ ok: false, reason: 'token_missing' }, 200, origin);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'invalid JSON' }, 400, origin); }

  const {
    event,
    event_id,
    url,
    referrer,
    user_agent,
    email,
    phone,
    first_name,
    last_name,
    external_id,
    ttclid,
    properties = {}
  } = body;

  if (!event) return json({ error: 'event is required' }, 400, origin);

  // IP real — Cloudflare injeta CF-Connecting-IP automaticamente
  const ip = request.headers.get('CF-Connecting-IP')
           || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
           || '';

  // ── PII hasheado (SHA-256) ──────────────────────────────────────────────
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

  const user = {};
  if (ip)               user.ip          = ip;
  if (user_agent)       user.user_agent  = user_agent;
  if (ttclid)           user.ttclid      = ttclid;
  if (hashedEmail)      user.email       = hashedEmail;
  if (hashedPhone)      user.phone       = hashedPhone;
  if (hashedFirstName)  user.first_name  = hashedFirstName;
  if (hashedLastName)   user.last_name   = hashedLastName;
  if (hashedExternalId) user.external_id = hashedExternalId;

  const page = {};
  if (url)      page.url      = url;
  if (referrer) page.referrer = referrer;

  const eventProperties = {};
  if (properties.value !== undefined) eventProperties.value        = Number(properties.value);
  if (properties.currency)            eventProperties.currency     = properties.currency;
  if (properties.content_type)        eventProperties.content_type = properties.content_type;
  else                                eventProperties.content_type = 'product';

  if (properties.content_id || properties.campaign_id) {
    eventProperties.contents = [{
      content_id:   String(properties.content_id || properties.campaign_id || ''),
      content_name: properties.content_name || 'Donation — Good Green Foundation',
      price:        Number(properties.value) || 0,
      quantity:     1
    }];
  }

  const eventData = {
    event:      event,
    event_time: Math.floor(Date.now() / 1000),
    event_id:   event_id || `${event}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    user:       user,
    properties: eventProperties
  };
  if (Object.keys(page).length) eventData.page = page;

  const payload = {
    event_source:    'web',
    event_source_id: PIXEL_ID,
    data: [eventData]
  };
  if (TEST_CODE) payload.test_event_code = TEST_CODE;

  try {
    const ttRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method:  'POST',
      headers: {
        'Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await ttRes.json();

    if (result.code !== 0) {
      console.error('[TikTok] API error:', JSON.stringify(result));
    } else {
      console.log('[TikTok] Event sent:', event, '| code:', result.code);
    }

    return json({ ok: result.code === 0, code: result.code, message: result.message }, 200, origin);

  } catch (err) {
    console.error('[TikTok] Fetch error:', err.message);
    return json({ ok: false, reason: 'fetch_error' }, 200, origin);
  }
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
  });
}
