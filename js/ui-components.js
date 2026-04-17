/**
 * ClearSky Foundation — Shared UI Helpers
 * -----------------------------------------
 * Format helpers, navigation toggle, toast, category labels,
 * and demo data fallback so the site stays usable before Supabase is wired up.
 */
(function () {
  'use strict';

  const CATEGORY_LABELS = {
    health:    'Health',
    education: 'Education',
    disaster: 'Disaster Relief',
    children: 'Children & Family',
    animals:  'Animals',
    community: 'Community',
    environment: 'Environment',
    other: 'Other'
  };

  const CATEGORY_LIST = Object.keys(CATEGORY_LABELS);

  function fmtMoney(n) {
    if (n === null || n === undefined || isNaN(n)) return '$0';
    n = Number(n);
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 10000)   return '$' + Math.round(n / 1000) + 'k';
    return '$' + n.toLocaleString('en-US');
  }

  function fmtMoneyFull(n) {
    if (n === null || n === undefined || isNaN(n)) return '$0';
    return '$' + Number(n).toLocaleString('en-US');
  }

  function percent(raised, goal) {
    if (!goal || goal <= 0) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
  }

  function categoryLabel(key) {
    return CATEGORY_LABELS[key] || (key ? (key.charAt(0).toUpperCase() + key.slice(1)) : '');
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  function toast(msg, variant) {
    let el = document.getElementById('clearsky-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'clearsky-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.className = 'toast ' + (variant || '');
    el.textContent = msg;
    // next frame so transition fires even if reused
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3200);
  }

  // ── Nav burger ───────────────────────────────────────────────────────────
  function initNav() {
    const burger = document.querySelector('.nav-burger');
    const menu   = document.querySelector('.nav-mobile');
    if (!burger || !menu) return;
    burger.addEventListener('click', () => menu.classList.toggle('open'));
    menu.addEventListener('click', e => {
      if (e.target.tagName === 'A') menu.classList.remove('open');
    });
  }

  // ── Campaign card renderer ──────────────────────────────────────────────
  function renderCampaignCard(c) {
    const pct = percent(c.raised, c.goal);
    const cat = categoryLabel(c.category);
    const img = c.image_url
      ? `background-image: url('${escapeHtml(c.image_url)}')`
      : `background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)`;
    return `
      <a class="camp-card" href="campaign-detail.html?id=${encodeURIComponent(c.id)}">
        <div class="camp-card-img" style="${img}">
          <span class="camp-card-cat">${escapeHtml(cat)}</span>
        </div>
        <div class="camp-card-body">
          <h3 class="camp-card-title">${escapeHtml(c.title || 'Untitled campaign')}</h3>
          <div class="camp-card-org">${escapeHtml(c.organizer || 'ClearSky contributor')}</div>
          <div class="camp-card-progress"><div class="camp-card-bar" style="width:${pct}%"></div></div>
          <div class="camp-card-meta">
            <span><span class="raised">${fmtMoney(c.raised)}</span> raised</span>
            <span>${pct}% of ${fmtMoney(c.goal)}</span>
          </div>
        </div>
      </a>`;
  }

  // ── Demo campaigns (used when Supabase isn't configured yet) ────────────
  const DEMO_CAMPAIGNS = [
    {
      id: 'demo-1',
      title: "Clean Water for Maple Creek Elementary",
      description: "Installing a modern filtration system so 420 students can drink safe water every day. Every contribution moves us closer to healthy classrooms.",
      category: 'education',
      goal: 28000,
      raised: 19850,
      organizer: 'Maple Creek PTA',
      location: 'Asheville, NC',
      image_url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=1000&q=80',
      created_at: '2026-03-12'
    },
    {
      id: 'demo-2',
      title: "Medical Support for Daniel's Recovery",
      description: "Daniel is a nurse and father of two recovering from a stroke. Funds cover rehabilitation and adaptive equipment while he regains his independence.",
      category: 'health',
      goal: 45000,
      raised: 31200,
      organizer: 'The Okafor Family',
      location: 'Portland, OR',
      image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1000&q=80',
      created_at: '2026-03-20'
    },
    {
      id: 'demo-3',
      title: "Rebuilding After the Tulsa Storms",
      description: "Six families lost their homes in the April storms. Your donation buys materials and hires local crews to get them back under a roof by summer.",
      category: 'disaster',
      goal: 120000,
      raised: 88400,
      organizer: 'Neighbors of Tulsa',
      location: 'Tulsa, OK',
      image_url: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=1000&q=80',
      created_at: '2026-04-02'
    },
    {
      id: 'demo-4',
      title: "Winter Coats for Kids in Shelter",
      description: "Warm coats, hats, and boots for 180 children spending this winter in transitional shelters across the Twin Cities.",
      category: 'children',
      goal: 15000,
      raised: 9420,
      organizer: 'Bright Start Minnesota',
      location: 'Minneapolis, MN',
      image_url: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=1000&q=80',
      created_at: '2026-03-28'
    },
    {
      id: 'demo-5',
      title: "Adopt a Rescue — Safe Haven Shelter",
      description: "Our no-kill shelter cares for 60 dogs and cats awaiting forever homes. Donations fund veterinary care, food, and transport.",
      category: 'animals',
      goal: 22000,
      raised: 16750,
      organizer: 'Safe Haven Shelter',
      location: 'Austin, TX',
      image_url: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1000&q=80',
      created_at: '2026-03-05'
    },
    {
      id: 'demo-6',
      title: "Community Garden in East Oakland",
      description: "Turning a vacant lot into a produce-bearing garden for neighbors. Budget covers soil, water hookup, raised beds, and a shed.",
      category: 'community',
      goal: 18500,
      raised: 6320,
      organizer: 'East Oakland Growers',
      location: 'Oakland, CA',
      image_url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1000&q=80',
      created_at: '2026-04-08'
    }
  ];

  async function fetchCampaigns(opts) {
    opts = opts || {};
    if (window.ClearSky && window.ClearSky.db && window.ClearSky.db.isConfigured) {
      try {
        return await window.ClearSky.db.listCampaigns(opts);
      } catch (e) {
        console.warn('[ClearSky] Supabase fetch failed, using demo data:', e.message);
      }
    }
    // Filter demo data client-side so the site still works.
    let rows = DEMO_CAMPAIGNS.slice();
    if (opts.category && opts.category !== 'all') {
      rows = rows.filter(c => c.category === opts.category);
    }
    if (opts.order && opts.order.indexOf('raised') === 0) {
      rows.sort((a, b) => b.raised - a.raised);
    }
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return rows;
  }

  async function fetchCampaignById(id) {
    if (window.ClearSky && window.ClearSky.db && window.ClearSky.db.isConfigured) {
      try { return await window.ClearSky.db.getCampaign(id); }
      catch (e) { console.warn('[ClearSky] getCampaign failed:', e.message); }
    }
    return DEMO_CAMPAIGNS.find(c => c.id === id) || null;
  }

  // ── Expose ───────────────────────────────────────────────────────────────
  window.ClearSky = window.ClearSky || {};
  window.ClearSky.ui = {
    fmtMoney,
    fmtMoneyFull,
    percent,
    categoryLabel,
    escapeHtml,
    toast,
    initNav,
    renderCampaignCard,
    fetchCampaigns,
    fetchCampaignById,
    CATEGORY_LIST,
    CATEGORY_LABELS,
    DEMO_CAMPAIGNS
  };

  document.addEventListener('DOMContentLoaded', initNav);
})();
