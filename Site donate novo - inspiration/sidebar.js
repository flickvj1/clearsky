(function () {
  'use strict';

  // ── Build sidebar DOM ─────────────────────────────────────────
  const sidebar = document.createElement('aside');
  sidebar.className = 'gg-sidebar';
  sidebar.id = 'ggSidebar';
  sidebar.setAttribute('aria-hidden', 'true');

  const overlay = document.createElement('div');
  overlay.className = 'gg-sidebar-overlay';
  overlay.id = 'ggSidebarOverlay';

  // Detect logo path relative to current page
  const logoImg = document.querySelector('nav .logo-img');
  const logoSrc = logoImg ? logoImg.getAttribute('src') : 'logo-ggf.png';

  sidebar.innerHTML = `
    <div class="gg-sb-hdr">
      <button class="gg-sb-close" id="ggSidebarClose" aria-label="Fechar menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="gg-sb-nav" id="ggSbNav"></div>
    <div class="gg-sb-footer">
      <a href="start-yourself.html" class="gg-sb-cta">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Start a Campaign
      </a>
    </div>
  `;

  // ── Nav structure (fixed — same on every page) ────────────────
  var NAV = [
    {
      title: 'How to Help',
      links: [
        { href: 'campaigns.html',    label: 'Campaigns' },
        { href: 'causes.html',       label: 'Causes' },
        { href: 'start-yourself.html', label: 'Start a Campaign' }
      ]
    },
    {
      title: 'Discover',
      links: [
        { href: 'most-loved.html',   label: 'Most Loved' },
        { href: 'events.html',       label: 'Events' },
        { href: 'blog.html',         label: 'Blog' }
      ]
    },
    {
      title: 'Company',
      links: [
        { href: 'about.html',        label: 'About Us' },
        { href: 'contact.html',      label: 'Contact Us' }
      ]
    }
  ];

  function buildNav() {
    var sbNav = sidebar.querySelector('#ggSbNav');

    NAV.forEach(function (section) {
      var sec = document.createElement('div');
      sec.className = 'gg-sb-section';

      var title = document.createElement('div');
      title.className = 'gg-sb-section-title';
      title.textContent = section.title;
      sec.appendChild(title);

      section.links.forEach(function (item) {
        var a = document.createElement('a');
        a.href = item.href;
        a.className = 'gg-sb-link';
        a.textContent = item.label;
        sec.appendChild(a);
      });

      sbNav.appendChild(sec);
    });
  }

  // ── Open / Close ──────────────────────────────────────────────
  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    sidebar.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    sidebar.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ── Init ──────────────────────────────────────────────────────
  document.body.appendChild(overlay);
  document.body.appendChild(sidebar);
  buildNav();

  overlay.addEventListener('click', closeSidebar);
  document.getElementById('ggSidebarClose').addEventListener('click', closeSidebar);

  // Replace hamburger click handler
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    // Remove old listeners by cloning
    const newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);
    newHamburger.addEventListener('click', openSidebar);
  }

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSidebar();
  });
})();
