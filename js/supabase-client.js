/**
 * ClearSky Foundation — Supabase REST Client
 * -------------------------------------------
 * Lightweight wrapper around Supabase PostgREST using fetch().
 * No external dependencies. Configure SUPA_URL + SUPA_KEY below.
 *
 * Security model:
 *   - The anon key is PUBLIC and safe to expose.
 *   - Row Level Security (RLS) on the Supabase side enforces:
 *       SELECT: only rows where active = true
 *       INSERT: allowed but forces active = false via default
 *       UPDATE/DELETE: admin only
 */
(function () {
  'use strict';

  // ── CONFIG — replace these with your real Supabase project values ───────
  const SUPA_URL = window.CLEARSKY_SUPA_URL || 'https://YOUR-PROJECT.supabase.co';
  const SUPA_KEY = window.CLEARSKY_SUPA_KEY || 'YOUR_PUBLIC_ANON_KEY';

  const headers = {
    'apikey': SUPA_KEY,
    'Authorization': 'Bearer ' + SUPA_KEY,
    'Content-Type': 'application/json'
  };

  async function request(path, opts) {
    opts = opts || {};
    const res = await fetch(SUPA_URL + '/rest/v1' + path, {
      method: opts.method || 'GET',
      headers: Object.assign({}, headers, opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error('Supabase ' + res.status + ': ' + text);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ── Campaign helpers ─────────────────────────────────────────────────────
  async function listCampaigns(opts) {
    opts = opts || {};
    const params = new URLSearchParams();
    params.set('active', 'eq.true');
    if (opts.category && opts.category !== 'all') {
      params.set('category', 'eq.' + opts.category);
    }
    if (opts.order)  params.set('order', opts.order);
    else             params.set('order', 'created_at.desc');
    if (opts.limit)  params.set('limit', String(opts.limit));
    if (opts.offset) params.set('offset', String(opts.offset));
    return request('/campaigns?' + params.toString());
  }

  async function getCampaign(id) {
    const rows = await request('/campaigns?id=eq.' + encodeURIComponent(id) + '&active=eq.true');
    return rows && rows[0] ? rows[0] : null;
  }

  async function searchCampaigns(term) {
    const q = term.replace(/[%_]/g, '').trim();
    if (!q) return listCampaigns();
    const params = new URLSearchParams();
    params.set('active', 'eq.true');
    params.set('or', '(title.ilike.*' + q + '*,description.ilike.*' + q + '*,organizer.ilike.*' + q + '*)');
    params.set('order', 'created_at.desc');
    return request('/campaigns?' + params.toString());
  }

  async function createCampaign(data) {
    // Insert — active forced to false by DB default (see RLS policy docs).
    const row = Object.assign({}, data, { active: false, raised: 0 });
    return request('/campaigns', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: row
    });
  }

  // ── Storage helpers (public campaign-images bucket) ─────────────────────
  async function uploadCampaignImage(file, prefix) {
    prefix = prefix || 'uploads';
    const safe = (file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = prefix + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + safe;
    const url = SUPA_URL + '/storage/v1/object/campaign-images/' + path;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'x-upsert': 'true',
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error('Upload failed (' + res.status + '): ' + text);
    }
    return SUPA_URL + '/storage/v1/object/public/campaign-images/' + path;
  }

  // ── Public API ──────────────────────────────────────────────────────────
  window.ClearSky = window.ClearSky || {};
  window.ClearSky.db = {
    listCampaigns,
    getCampaign,
    searchCampaigns,
    createCampaign,
    uploadCampaignImage,
    isConfigured: !SUPA_URL.includes('YOUR-PROJECT') && !SUPA_KEY.includes('YOUR_PUBLIC'),
    SUPA_URL,
    SUPA_KEY
  };
})();
