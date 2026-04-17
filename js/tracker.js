/**
 * ClearSky Foundation — Marketing Pixel Tracker (stub)
 * ------------------------------------------------------
 * Initializes optional Facebook + TikTok pixels when IDs are set in
 * window.CLEARSKY_FB_PIXEL_ID / window.CLEARSKY_TT_PIXEL_ID.
 *
 * Exposes:
 *   ClearSky.track.event(name, props)
 *   ClearSky.track.donationStart(ctx)
 *   ClearSky.track.donationComplete(ctx)
 *   ClearSky.track.buildStripeUrl(baseUrl, extras)
 *
 * Payment-state bridge:
 *   The donate flow stashes donation context in localStorage before
 *   redirecting to Stripe; payment-success.html reads it back out on
 *   return from Stripe and fires the Purchase/CompletePayment event.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'clearsky_donation_pending';
  const FB_PIXEL_ID = window.CLEARSKY_FB_PIXEL_ID || '';
  const TT_PIXEL_ID = window.CLEARSKY_TT_PIXEL_ID || '';

  // ── Facebook Pixel init (optional) ──────────────────────────────────────
  if (FB_PIXEL_ID) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    try {
      window.fbq('init', FB_PIXEL_ID);
      window.fbq('track', 'PageView');
    } catch (_) {}
  }

  // ── TikTok Pixel init (optional) ────────────────────────────────────────
  if (TT_PIXEL_ID) {
    /* eslint-disable */
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
    ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)));};};
    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
    ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
    var o=d.createElement("script");o.type="text/javascript";o.async=!0;
    o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ttq.load(TT_PIXEL_ID);ttq.page();}(window,document,'ttq');
    /* eslint-enable */
  }

  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function event(name, props) {
    props = props || {};
    try {
      if (window.fbq) window.fbq('track', name, props);
    } catch (_) {}
    try {
      if (window.ttq && window.ttq.track) window.ttq.track(name, props);
    } catch (_) {}
  }

  function saveDonationContext(ctx) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.assign({
        ts: Date.now()
      }, ctx)));
    } catch (_) {}
  }

  function readDonationContext(maxAgeMs) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (maxAgeMs && (Date.now() - (data.ts || 0)) > maxAgeMs) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  function clearDonationContext() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  function donationStart(ctx) {
    saveDonationContext(ctx);
    event('InitiateCheckout', {
      value: ctx.amount,
      currency: 'USD',
      content_ids: [ctx.campaignId || 'general'],
      content_type: 'donation'
    });
  }

  function donationComplete(ctx) {
    event('Purchase', {
      value: ctx.amount,
      currency: 'USD',
      content_ids: [ctx.campaignId || 'general'],
      content_type: 'donation'
    });
    try {
      if (window.ttq && window.ttq.track) {
        window.ttq.track('CompletePayment', { value: ctx.amount, currency: 'USD' });
      }
    } catch (_) {}
  }

  function buildStripeUrl(baseUrl, extras) {
    extras = extras || {};
    const sep = baseUrl.indexOf('?') !== -1 ? '&' : '?';
    const ref = [uuid(), extras.campaignId || '', extras.amount || ''].join('--');
    const safe = ref.replace(/[^a-zA-Z0-9\-_]/g, '_').slice(0, 200);
    return baseUrl + sep + 'client_reference_id=' + encodeURIComponent(safe);
  }

  window.ClearSky = window.ClearSky || {};
  window.ClearSky.track = {
    event,
    donationStart,
    donationComplete,
    saveDonationContext,
    readDonationContext,
    clearDonationContext,
    buildStripeUrl,
    STORAGE_KEY
  };
})();
