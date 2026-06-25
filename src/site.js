// Shared site chrome: injects the top nav + footer into every page, marks the
// active link, fills in festival facts/links, and mounts SVG icons. Each page's
// entry script calls initSite() first, then does page-specific work.

import './style/tokens.css';
import './style/fonts.css';
import './style/base.css';
import './style/layout.css';
import './style/map.css';
import './style/components.css';
import './style/themes.css';

import { FESTIVAL } from './constants.js';
import { mountIcons } from './icons.js';
import wordmarkUrl from './assets/2026/wordmark.png';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/this-year', label: '2026' },
  { href: '/map', label: 'Map' },
  { href: '/get-involved', label: 'Get Involved' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

// Normalize the current path to one of the NAV_LINKS hrefs.
function currentPath() {
  let p = window.location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
  if (p.length > 1) p = p.replace(/\/$/, '');
  return p || '/';
}

function renderNav() {
  const host = document.getElementById('site-nav');
  if (!host) return;
  const here = currentPath();
  host.className = 'site-nav';
  host.innerHTML = `
    <a href="/" class="site-nav__brand" aria-label="Portsmouth Porchfest — home">
      <img class="site-nav__logo" src="${wordmarkUrl}" alt="Portsmouth Porchfest" width="120" height="39" />
    </a>
    <nav>
      <ul class="site-nav__links">
        ${NAV_LINKS.map(
          (l) => `<li><a href="${l.href}"${l.href === here ? ' aria-current="page"' : ''}>${l.label}</a></li>`
        ).join('')}
      </ul>
    </nav>`;
}

function renderFooter() {
  const host = document.getElementById('site-footer');
  if (!host) return;
  host.className = 'site-footer';
  host.innerHTML = `
    <nav class="site-footer__links">
      <a href="mailto:${FESTIVAL.email}"><span data-icon="email" aria-hidden="true"></span>Email</a>
      <a href="${FESTIVAL.instagram}" target="_blank" rel="noopener"><span data-icon="instagram" aria-hidden="true"></span>Instagram</a>
      <a href="${FESTIVAL.facebook}" target="_blank" rel="noopener"><span data-icon="facebook" aria-hidden="true"></span>Facebook</a>
    </nav>
    <p class="site-footer__fine">
      Portsmouth Porchfest · ${FESTIVAL.location} · A free community event.
    </p>`;
}

// Fill any [data-festival="key"] element with FESTIVAL[key], and set hrefs on
// elements tagged with [data-festival-link="key"].
function hydrateFestival() {
  document.querySelectorAll('[data-festival]').forEach((el) => {
    const key = el.dataset.festival;
    if (FESTIVAL[key] != null) el.textContent = FESTIVAL[key];
  });
  document.querySelectorAll('[data-festival-link]').forEach((el) => {
    const key = el.dataset.festivalLink;
    if (FESTIVAL[key]) el.href = FESTIVAL[key];
  });
}

export function initSite() {
  renderNav();
  renderFooter();
  hydrateFestival();
  mountIcons();

  // Dev-only WYSIWYG "Review Mode" for live copy edits + notes. The DEV guard is
  // a compile-time constant, so this dynamic import is stripped from prod builds.
  if (import.meta.env.DEV) {
    import('./dev/review-mode.js').then((m) => m.initReviewMode()).catch(() => {});
  }
}
