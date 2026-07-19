// SVG asset registry. Vite imports each file as a raw string (`?raw`) so the
// markup is inlined into the DOM — that means icons inherit `currentColor` and
// can be sized/animated with CSS, with zero extra network requests.
//
// Add a new icon: drop the .svg in src/assets/icons/, make sure its strokes/
// fills use `currentColor`, then import + register it below.

import mark from './assets/mark.svg?raw';
import arrow from './assets/icons/arrow.svg?raw';
import pin from './assets/icons/pin.svg?raw';
import info from './assets/icons/info.svg?raw';
import instagram from './assets/icons/instagram.svg?raw';
import facebook from './assets/icons/facebook.svg?raw';
import email from './assets/icons/email.svg?raw';

export const ICONS = { mark, arrow, pin, info, instagram, facebook, email };

// Returns the raw inline SVG string for a given name (empty string if unknown).
export function icon(name) {
  return ICONS[name] || '';
}

// Injects an icon into a host element (or all elements matching a selector).
// Usage in HTML: <span data-icon="arrow"></span>
export function mountIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const svg = icon(el.dataset.icon);
    if (svg) el.innerHTML = svg;
  });
}
