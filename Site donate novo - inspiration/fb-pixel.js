/**
 * Good Green Foundation — Facebook Pixel + CAPI Tracker
 * -------------------------------------------------------
 * Responsabilidades:
 *  1. Inicializa o Facebook Pixel em todas as páginas
 *  2. Captura fbclid da URL → salva como cookie _fbc + localStorage (persiste 180 dias)
 *  3. Mantém _fbc e _fbp acessíveis em toda navegação do site
 *  4. Expõe window.GGF.buildStripeUrl(url) para injetar client_reference_id nos links Stripe
 *     Formato: "eventId|fbc|fbp" — interpretado pelo webhook server
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIG — altere aqui
  // ─────────────────────────────────────────────────────────────────────────
  var FB_PIXEL_IDS = ['1195694085976050'];
  // ─────────────────────────────────────────────────────────────────────────

  // ── 1. Inicializa Facebook Pixel ────────────────────────────────────────
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  FB_PIXEL_IDS.forEach(function (id) { window.fbq('init', id); });
  window.fbq('track', 'PageView');

  // ── 2. Helpers de cookie ─────────────────────────────────────────────────
  function getCookie(name) {
    var pairs = document.cookie.split('; ');
    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i].indexOf(name + '=') === 0) {
        return decodeURIComponent(pairs[i].slice(name.length + 1));
      }
    }
    return null;
  }

  function setCookie(name, value, maxAgeSecs) {
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; path=/; max-age=' + maxAgeSecs + '; SameSite=Lax';
  }

  // ── 3. Captura fbclid → _fbc (cookie + localStorage) ────────────────────
  function captureFbclid() {
    try {
      var params = new URLSearchParams(window.location.search);
      var fbclid = params.get('fbclid');
      if (!fbclid) return;

      // Formato exigido pelo Facebook: "fb.1.{timestamp}.{fbclid}"
      var fbc = 'fb.1.' + Date.now() + '.' + fbclid;
      var maxAge = 180 * 24 * 60 * 60; // 180 dias

      setCookie('_fbc', fbc, maxAge);
      try { localStorage.setItem('_fbc', fbc); } catch (e) { /* private mode */ }
    } catch (e) {
      console.warn('[GGF Pixel] captureFbclid error:', e);
    }
  }

  // ── 4. Lê _fbc com fallback localStorage ────────────────────────────────
  function getFbc() {
    var fromCookie = getCookie('_fbc');
    if (fromCookie) return fromCookie;
    try { return localStorage.getItem('_fbc') || ''; } catch (e) { return ''; }
  }

  // ── 5. Lê _fbp (criado automaticamente pelo fbevents.js) ─────────────────
  function getFbp() {
    return getCookie('_fbp') || '';
  }

  // ── 6. Gera UUID v4 ──────────────────────────────────────────────────────
  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback para browsers antigos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // ── 7. buildStripeUrl ────────────────────────────────────────────────────
  /**
   * Recebe um link Stripe base e retorna o mesmo link com o parâmetro
   * client_reference_id preenchido com os dados de rastreamento FB.
   *
   * Formato do client_reference_id: "{eventId}|{fbc}|{fbp}"
   * O webhook server lê este campo e envia para a Facebook CAPI.
   *
   * Limite Stripe: 200 caracteres — a composição abaixo cabe com folga:
   *   UUID (36) + "|" + fbc (~79) + "|" + fbp (~29) ≈ 146 chars
   *
   * @param {string} baseUrl - URL do Stripe Payment Link
   * @returns {string} URL com client_reference_id adicionado
   */
  function buildStripeUrl(baseUrl) {
    var eventId = generateUUID();
    var fbc     = getFbc();
    var fbp     = getFbp();

    // Armazena eventId para possível uso na página de sucesso (deduplicação)
    try { sessionStorage.setItem('fb_event_id', eventId); } catch (e) { /* ok */ }

    var ref = [eventId, fbc, fbp].join('|');

    // Proteção contra limite de 200 chars (muito improvável, mas seguro)
    if (ref.length > 200) {
      ref = [eventId, fbc, ''].join('|');
    }

    var sep = baseUrl.indexOf('?') !== -1 ? '&' : '?';
    return baseUrl + sep + 'client_reference_id=' + encodeURIComponent(ref);
  }

  // ── 8. API pública ───────────────────────────────────────────────────────
  window.GGF = window.GGF || {};
  window.GGF.buildStripeUrl = buildStripeUrl;
  window.GGF.pixelIds       = FB_PIXEL_IDS;
  window.GGF.getFbc         = getFbc;
  window.GGF.getFbp         = getFbp;

  // ── 9. Executa captura ao carregar ───────────────────────────────────────
  captureFbclid();

})();
