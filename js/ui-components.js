/**
 * ClearSky Foundation — Shared UI Helpers
 * ----------------------------------------
 * Format helpers, navigation toggle, toast, category labels, campaign renderer,
 * demo campaigns + demo donors feed so the site stays usable before Supabase is wired.
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

  // SVG category icons used by the homepage category grid.
  const CATEGORY_ICONS = {
    health:      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    education:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    disaster:    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    children:    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    animals:     '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10z"/></svg>',
    community:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>',
    environment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20V10M12 20V4M17 20v-6"/></svg>',
    other:       '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></svg>'
  };

  // Formatters ─────────────────────────────────────────────────
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
  function categoryIcon(key) {
    return CATEGORY_ICONS[key] || CATEGORY_ICONS.other;
  }
  function initial(name) {
    return String(name || '?').trim().charAt(0).toUpperCase() || '?';
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Toast ─────────────────────────────────────────────────────
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
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3200);
  }

  // Nav ───────────────────────────────────────────────────────
  function initNav() {
    const burger = document.querySelector('.nav-burger');
    const menu   = document.querySelector('.nav-mobile');
    if (!burger || !menu) return;
    burger.addEventListener('click', () => menu.classList.toggle('open'));
    menu.addEventListener('click', e => {
      if (e.target.tagName === 'A') menu.classList.remove('open');
    });
  }

  // Richer campaign card ──────────────────────────────────────
  function renderCampaignCard(c, opts) {
    opts = opts || {};
    const pct = percent(c.raised, c.goal);
    const cat = categoryLabel(c.category);
    const catKey = c.category || 'other';
    const img = c.image_url
      ? `background-image: url('${escapeHtml(c.image_url)}')`
      : `background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)`;
    const urgent = !!(c.urgent || opts.urgent);
    const donorCount = c.donor_count || Math.max(6, Math.floor((c.raised || 0) / 58));
    const pctClass = pct >= 100 ? 'pct-pill full' : 'pct-pill';
    const org = c.organizer || 'ClearSky contributor';
    const orgInit = initial(org);
    const loc = c.location ? `
      <div class="camp-card-loc">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${escapeHtml(c.location)}
      </div>` : '';

    return `
      <a class="camp-card" href="campaign-detail.html?id=${encodeURIComponent(c.id)}">
        <div class="camp-card-img" style="${img}">
          <span class="cat-pill" data-cat="${escapeHtml(catKey)}">${escapeHtml(cat)}</span>
          ${urgent ? '<span class="urgent-pill">Urgent</span>' : ''}
          <div class="camp-card-overlay-org">
            <span class="av">${escapeHtml(orgInit)}</span>
            <span>${escapeHtml(org)}</span>
          </div>
        </div>
        <div class="camp-card-body">
          <h3 class="camp-card-title">${escapeHtml(c.title || 'Untitled campaign')}</h3>
          ${loc}
          <div class="camp-card-progress"><div class="camp-card-bar" style="width:${pct}%"></div></div>
          <div class="camp-card-meta">
            <span><span class="raised">${fmtMoneyFull(c.raised)}</span> raised of ${fmtMoney(c.goal)}</span>
            <span class="${pctClass}">${pct}%</span>
          </div>
          <div class="camp-card-footer">
            <div class="camp-card-donors">
              <div class="avatars">
                <span class="av av-1">${escapeHtml(initial(org))}</span>
                <span class="av av-2">M</span>
                <span class="av av-3">J</span>
                <span class="av av-4">S</span>
              </div>
              <span>${donorCount.toLocaleString('en-US')} donors</span>
            </div>
            <span class="verified-ink">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
              Verified
            </span>
          </div>
        </div>
      </a>`;
  }

  // Demo campaigns (fallback) ─────────────────────────────────
  const DEMO_CAMPAIGNS = [
    {
      id: 'demo-1',
      title: "Clean Water for Maple Creek Elementary",
      description: "Our school serves 420 students in rural Asheville, and for the past six months the tap water has tested above federal lead limits. Families have been sending kids in with bottled water, and teachers have been rationing what they can.\n\nWe are raising funds to install a certified lead-removal filtration system on every water fountain and kitchen tap. The quote from Appalachian Water Systems is $28,000, which covers equipment, installation, and a two-year service plan. Any excess will go toward annual replacement cartridges.\n\nEvery child deserves clean water. Thank you for standing with our little mountain school.",
      category: 'education',
      goal: 28000,
      raised: 19850,
      organizer: 'Maple Creek PTA',
      location: 'Asheville, NC',
      image_url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=1000&q=80',
      urgent: false,
      created_at: '2026-03-12'
    },
    {
      id: 'demo-2',
      title: "Medical Support for Daniel's Recovery",
      description: "Daniel is a 38-year-old pediatric nurse and father of two who suffered a severe stroke on March 2nd. After three weeks in the ICU he is now home, but faces a long road of physical and speech therapy that is only partially covered by insurance.\n\nFunds raised will cover the $32,000 gap in therapy costs over the next six months, plus adaptive equipment for his home — a stair lift, a walker, and voice-controlled devices. Daniel has spent his whole career caring for other people's kids. Now it's our turn to care for him.",
      category: 'health',
      goal: 45000,
      raised: 31200,
      organizer: 'The Okafor Family',
      location: 'Portland, OR',
      image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1000&q=80',
      urgent: true,
      created_at: '2026-03-20'
    },
    {
      id: 'demo-3',
      title: "Rebuilding After the Tulsa Storms",
      description: "Six families on our block lost everything when the April 7th tornado tore through North Tulsa. We are a small neighborhood network of long-time residents, and we are pooling our efforts to rebuild what insurance won't cover.\n\nThe $120,000 target funds materials, permits, and local crews to get every family back under a roof before winter. We have receipts, photos, and a public project tracker. Updates posted weekly.",
      category: 'disaster',
      goal: 120000,
      raised: 88400,
      organizer: 'Neighbors of Tulsa',
      location: 'Tulsa, OK',
      image_url: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=1000&q=80',
      urgent: true,
      created_at: '2026-04-02'
    },
    {
      id: 'demo-4',
      title: "Winter Coats for Kids in Shelter",
      description: "Bright Start partners with four transitional shelters across the Twin Cities. This winter we want to outfit 180 kids (ages 2-14) with a new coat, hat, gloves, and boots so they can keep going to school safely through January and February.\n\nWe have a direct-buy arrangement with a local distributor that cuts retail prices by 40%. Every $85 puts a full winter kit on one child.",
      category: 'children',
      goal: 15000,
      raised: 9420,
      organizer: 'Bright Start Minnesota',
      location: 'Minneapolis, MN',
      image_url: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=1000&q=80',
      urgent: false,
      created_at: '2026-03-28'
    },
    {
      id: 'demo-5',
      title: "Adopt a Rescue — Safe Haven Shelter",
      description: "Safe Haven is a no-kill shelter in East Austin that cares for 60 cats and dogs at any given time. We are a 100% volunteer operation and every dollar goes directly to vet care, food, transport, and spay/neuter surgeries.\n\nThis campaign funds our Q2 operating budget. Our 2025 audit is public on our website. Thank you for giving these animals a soft landing.",
      category: 'animals',
      goal: 22000,
      raised: 16750,
      organizer: 'Safe Haven Shelter',
      location: 'Austin, TX',
      image_url: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1000&q=80',
      urgent: false,
      created_at: '2026-03-05'
    },
    {
      id: 'demo-6',
      title: "Community Garden in East Oakland",
      description: "We are turning a half-acre vacant lot on International Blvd into a thriving produce-bearing garden that will feed neighbors, train young people, and host free Saturday farm stands.\n\nThe budget covers clean soil, a water hookup, raised beds, fencing, and a tool shed. All construction will be done by local labor. Our first growing season starts June 2026.",
      category: 'community',
      goal: 18500,
      raised: 6320,
      organizer: 'East Oakland Growers',
      location: 'Oakland, CA',
      image_url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1000&q=80',
      urgent: false,
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

  // Demo donor feed ───────────────────────────────────────────
  // Deterministic (seeded by campaign id) so repeated loads look stable.
  const DEMO_FIRST = ['Sarah','Michael','Aisha','David','Priya','Jonah','Emma','Carlos','Fatima','Leo','Nora','Tomás','Grace','Ben','Zara','Mateo','Olivia','Ravi','Amira','Noah','Chloe','Samir','Isla','Ethan','Yuki','Liam','Harper','Elena','Kai','Maya'];
  const DEMO_LAST  = ['M.','K.','Rivera','J.','Patel','L.','Chen','B.','Okafor','W.','S.','R.','P.','N.','Torres','O.','T.','Kim','Gómez','V.','C.','Nguyen','Y.','A.','Anonymous'];
  function seedRng(seed) {
    let t = 0;
    for (let i = 0; i < String(seed).length; i++) t = (t * 31 + String(seed).charCodeAt(i)) >>> 0;
    return () => {
      t = (t * 1664525 + 1013904223) >>> 0;
      return t / 0xFFFFFFFF;
    };
  }
  function relTime(minsAgo) {
    if (minsAgo < 60) return minsAgo + ' min ago';
    if (minsAgo < 60 * 24) return Math.floor(minsAgo / 60) + ' hr ago';
    const d = Math.floor(minsAgo / (60 * 24));
    if (d === 1) return '1 day ago';
    if (d < 30) return d + ' days ago';
    const m = Math.floor(d / 30);
    return m === 1 ? '1 mo ago' : m + ' mo ago';
  }
  function generateDonors(campaign, count) {
    count = count || 8;
    const rng = seedRng(campaign.id || campaign.title || 'seed');
    const amounts = [10, 25, 35, 50, 75, 100, 150, 200, 250, 500, 1000];
    const out = [];
    let mins = 10;
    for (let i = 0; i < count; i++) {
      const first = DEMO_FIRST[Math.floor(rng() * DEMO_FIRST.length)];
      const last  = DEMO_LAST[Math.floor(rng() * DEMO_LAST.length)];
      const name  = last === 'Anonymous' ? 'Anonymous' : (first + ' ' + last);
      const amt   = amounts[Math.floor(rng() * amounts.length)];
      mins += 15 + Math.floor(rng() * 240);
      out.push({ name, amount: amt, minsAgo: mins, top: false });
    }
    // Mark highest amount as top donor
    const topAmt = Math.max.apply(null, out.map(d => d.amount));
    out.forEach(d => { if (d.amount === topAmt) { d.top = true; } });
    return out;
  }

  function renderDonorRow(d) {
    const cls = d.top ? 'top' : '';
    return `
      <div class="donor-row">
        <div class="av ${cls}">${escapeHtml(initial(d.name))}</div>
        <div class="info">
          <div class="name">${escapeHtml(d.name)}${d.top ? ' <span style="color:#D97706;font-size:.72rem;font-weight:800">★ Top donor</span>' : ''}</div>
          <div class="meta">${relTime(d.minsAgo)}</div>
        </div>
        <div class="amt ${cls}">${fmtMoneyFull(d.amount)}</div>
      </div>`;
  }

  // Expose ────────────────────────────────────────────────────
  window.ClearSky = window.ClearSky || {};
  window.ClearSky.ui = {
    fmtMoney, fmtMoneyFull, percent, categoryLabel, categoryIcon, initial,
    escapeHtml, toast, initNav,
    renderCampaignCard, renderDonorRow, generateDonors, relTime,
    fetchCampaigns, fetchCampaignById,
    CATEGORY_LIST, CATEGORY_LABELS, CATEGORY_ICONS, DEMO_CAMPAIGNS
  };

  document.addEventListener('DOMContentLoaded', initNav);
})();
