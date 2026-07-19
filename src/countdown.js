import { FESTIVAL } from './constants.js';

// Renders a live countdown into `el`. Three states:
//   before  → days / hours / minutes / seconds ticking down
//   during  → "It's happening now" with a jump-to-map link
//   after   → "See you next year"
export function initCountdown(el, opts = {}) {
  const start = opts.start ?? FESTIVAL.date;
  const end = opts.end ?? FESTIVAL.end;
  if (!el) return () => {};

  const units = [
    { key: 'days', label: 'Days' },
    { key: 'hours', label: 'Hours' },
    { key: 'minutes', label: 'Min' },
    { key: 'seconds', label: 'Sec' },
  ];

  function buildDigits() {
    el.innerHTML = units
      .map(
        (u) => `
        <div class="cd-unit">
          <span class="cd-num" data-unit="${u.key}">00</span>
          <span class="cd-label">${u.label}</span>
        </div>`
      )
      .join('<span class="cd-sep" aria-hidden="true">:</span>');
  }

  function renderMessage(text, withLink) {
    el.classList.add('countdown--message');
    el.innerHTML = `<p class="cd-message">${text}</p>${
      withLink ? '<a class="cd-cta" href="#map">View the map →</a>' : ''
    }`;
  }

  let mode = null; // 'digits' | 'before-start' message etc.

  function update() {
    const now = Date.now();
    const startMs = start.getTime();
    const endMs = end.getTime();

    if (now >= endMs) {
      renderMessage(FESTIVAL.nextYearLabel, false);
      return true; // done — stop ticking
    }
    if (now >= startMs) {
      renderMessage("It's happening now", true);
      return true; // event running; no need to tick every second
    }

    if (mode !== 'digits') {
      buildDigits();
      el.classList.remove('countdown--message');
      mode = 'digits';
    }

    const diff = startMs - now;
    const values = {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
    for (const u of units) {
      const node = el.querySelector(`[data-unit="${u.key}"]`);
      if (node) {
        const next = u.key === 'days' ? String(values.days) : pad(values[u.key]);
        if (node.textContent !== next) node.textContent = next;
      }
    }
    return false;
  }

  const done = update();
  let timer = null;
  if (!done) {
    timer = setInterval(() => {
      if (update()) clearInterval(timer);
    }, 1000);
  }

  return () => timer && clearInterval(timer);
}

function pad(n) {
  return String(n).padStart(2, '0');
}
