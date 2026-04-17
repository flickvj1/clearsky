/**
 * ClearSky Foundation — Front-End Configuration
 * ----------------------------------------------
 * Drop your Supabase project + Stripe Payment Links here.
 * This file ships to the browser, so only public values belong here.
 */
(function () {
  'use strict';

  // ── Supabase (public anon key — safe to expose; protect via RLS) ────────
  window.CLEARSKY_SUPA_URL = ''; // e.g. 'https://abcxyz.supabase.co'
  window.CLEARSKY_SUPA_KEY = ''; // public anon key

  // ── Marketing pixels (optional) ─────────────────────────────────────────
  window.CLEARSKY_FB_PIXEL_ID = '';
  window.CLEARSKY_TT_PIXEL_ID = '';

  // ── Stripe Payment Links — amount (USD) → link ─────────────────────────
  // Generate these in the Stripe Dashboard and paste below.
  window.CLEARSKY_STRIPE_ONETIME = {
    10:   '',
    25:   '',
    50:   '',
    100:  '',
    250:  '',
    500:  '',
    1000: ''
  };

  window.CLEARSKY_STRIPE_MONTHLY = {
    10:   '',
    25:   '',
    50:   '',
    100:  '',
    250:  '',
    500:  '',
    1000: ''
  };

  // Success redirect URL set in each Stripe Payment Link should point to
  // /payment-success.html?amount={amount}&campaign={id}. The amount also
  // persists via localStorage as a fallback.
})();
