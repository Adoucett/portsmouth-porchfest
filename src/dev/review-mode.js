// =====================================================================
// REVIEW MODE — dev-only in-place copy editor (WYSIWYG-ish)
//
// Loaded ONLY under `vite dev` (guarded by import.meta.env.DEV in site.js), so
// it is never bundled into the production build. Lets you edit any text on the
// rendered page, attach review notes to elements, and export a change list to
// fold back into the real source.
//
//   • Toggle with the floating "Review" button (or press "e")
//   • Click any text to edit it in place
//   • Shift-click an element to add/edit a note (e.g. Julia's feedback)
//   • Export → downloads JSON + Markdown and copies the Markdown to clipboard
//   • Edits persist per-page in localStorage during the session
// =====================================================================

const STORE_PREFIX = 'pf-review:';
let editing = false;

function pageKey() {
  return STORE_PREFIX + (window.location.pathname.replace(/\.html$/, '') || '/');
}

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(pageKey()) || '{}');
  } catch {
    return {};
  }
}

function saveStore(store) {
  localStorage.setItem(pageKey(), JSON.stringify(store));
}

// A reasonably stable CSS selector for an element (used to re-apply + locate).
function selectorFor(el) {
  if (el.id) return `#${el.id}`;
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && node.tagName !== 'BODY' && parts.length < 6) {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      parts.unshift(`#${node.id}`);
      break;
    }
    const parent = node.parentElement;
    if (parent) {
      const sameTag = [...parent.children].filter((c) => c.tagName === node.tagName);
      if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = node.parentElement;
  }
  return parts.join(' > ');
}

// Is this element a leaf-ish text node we should allow editing?
function isEditableText(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.closest('.pfrev')) return false; // never edit our own UI
  const tag = el.tagName;
  const ok = /^(H1|H2|H3|H4|H5|H6|P|SPAN|A|BUTTON|LI|FIGCAPTION|BLOCKQUOTE|STRONG|EM|SMALL|TD|TH|DT|DD|LABEL|SUMMARY)$/;
  if (!ok.test(tag)) return false;
  const text = (el.textContent || '').trim();
  if (!text) return false;
  // avoid containers that hold other block elements
  return !el.querySelector('p,h1,h2,h3,h4,div,ul,ol,section');
}

let toolbar, countEl;

function initReviewMode() {
  injectStyles();
  buildToolbar();
  wireEvents();
  reapplyEdits();
  updateCount();
}

function injectStyles() {
  const css = `
  .pfrev { font-family: var(--font-body, system-ui, sans-serif); }
  .pfrev-bar {
    position: fixed; z-index: 99999; right: 12px; bottom: 12px;
    display: flex; gap: 6px; align-items: center;
    background: #1a1a18; color: #f5f1e8; padding: 6px 8px;
    border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,.35);
    font-size: 12px;
  }
  .pfrev-bar button {
    font: inherit; cursor: pointer; border: 1px solid #4a473f;
    background: #2b2a25; color: #f5f1e8; border-radius: 5px; padding: 5px 9px;
  }
  .pfrev-bar button:hover { background: #3a3833; }
  .pfrev-bar .pfrev-on { background: #c4622d; border-color: #c4622d; color: #fff; }
  .pfrev-bar .pfrev-count { opacity: .8; padding: 0 4px; }
  .pfrev-tag {
    position: fixed; z-index: 99998; top: 12px; left: 12px;
    background: #c4622d; color: #fff; font-size: 11px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; padding: 4px 8px;
    border-radius: 5px; pointer-events: none;
  }
  body.pfrev-editing [contenteditable="true"] { outline: 2px solid #c4622d; outline-offset: 2px; }
  body.pfrev-editing .pfrev-hover { outline: 2px dashed #2b4a7a; outline-offset: 2px; cursor: text; }
  .pfrev-edited { background: rgba(196,98,45,.14); box-shadow: inset 0 -2px 0 #c4622d; }
  .pfrev-noted { box-shadow: inset 0 -2px 0 #2b4a7a; }
  .pfrev-noted::after {
    content: "🗒"; font-size: .7em; margin-left: 4px; vertical-align: super; opacity: .8;
  }`;
  const style = document.createElement('style');
  style.className = 'pfrev';
  style.textContent = css;
  document.head.appendChild(style);
}

function buildToolbar() {
  toolbar = document.createElement('div');
  toolbar.className = 'pfrev pfrev-bar';
  toolbar.innerHTML = `
    <button data-act="toggle" title="Toggle edit mode (e)">✎ Review</button>
    <span class="pfrev-count" data-count>0 changes</span>
    <button data-act="export" title="Download + copy change list">Export</button>
    <button data-act="clear" title="Clear edits on this page">Clear</button>`;
  document.body.appendChild(toolbar);
  countEl = toolbar.querySelector('[data-count]');
  toolbar.addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'toggle') setEditing(!editing);
    else if (act === 'export') exportChanges();
    else if (act === 'clear') clearChanges();
  });
}

function setEditing(on) {
  editing = on;
  document.body.classList.toggle('pfrev-editing', on);
  toolbar.querySelector('[data-act="toggle"]').classList.toggle('pfrev-on', on);
  let tag = document.querySelector('.pfrev-tag');
  if (on && !tag) {
    tag = document.createElement('div');
    tag.className = 'pfrev pfrev-tag';
    tag.textContent = 'Review mode — dev only';
    document.body.appendChild(tag);
  } else if (!on && tag) {
    tag.remove();
  }
}

function wireEvents() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'e' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
      setEditing(!editing);
    }
  });

  let hovered = null;
  document.addEventListener('pointerover', (e) => {
    if (!editing) return;
    const el = e.target;
    if (hovered && hovered !== el) hovered.classList.remove('pfrev-hover');
    if (isEditableText(el)) {
      el.classList.add('pfrev-hover');
      hovered = el;
    }
  });

  document.addEventListener(
    'click',
    (e) => {
      if (!editing) return;
      const el = e.target;
      if (el.closest('.pfrev')) return; // toolbar clicks
      if (!isEditableText(el) && !el.isContentEditable) return;
      e.preventDefault(); // stop link/button navigation while editing
      e.stopPropagation();
      if (e.shiftKey) {
        addNote(el);
        return;
      }
      beginEdit(el);
    },
    true
  );
}

function beginEdit(el) {
  if (el.isContentEditable) return;
  el.classList.remove('pfrev-hover');
  const original = el.dataset.pfrevOriginal ?? el.textContent.trim();
  el.dataset.pfrevOriginal = original;
  el.contentEditable = 'true';
  el.focus();
  const finish = () => {
    el.contentEditable = 'false';
    el.removeEventListener('blur', finish);
    recordEdit(el, original, el.textContent.trim());
  };
  el.addEventListener('blur', finish);
}

function addNote(el) {
  const store = loadStore();
  const sel = selectorFor(el);
  const existing = store[sel]?.note || '';
  const note = window.prompt('Review note for this element (Julia’s feedback, etc.):', existing);
  if (note === null) return;
  store[sel] = {
    selector: sel,
    tag: el.tagName.toLowerCase(),
    original: store[sel]?.original ?? el.dataset.pfrevOriginal ?? el.textContent.trim(),
    current: store[sel]?.current ?? el.textContent.trim(),
    note: note.trim(),
  };
  if (!store[sel].note && store[sel].original === store[sel].current) delete store[sel];
  saveStore(store);
  el.classList.toggle('pfrev-noted', !!note.trim());
  updateCount();
}

function recordEdit(el, original, current) {
  const store = loadStore();
  const sel = selectorFor(el);
  if (current === original && !store[sel]?.note) {
    delete store[sel];
    el.classList.remove('pfrev-edited');
  } else {
    store[sel] = {
      selector: sel,
      tag: el.tagName.toLowerCase(),
      original,
      current,
      note: store[sel]?.note || '',
    };
    el.classList.toggle('pfrev-edited', current !== original);
  }
  saveStore(store);
  updateCount();
}

function reapplyEdits() {
  const store = loadStore();
  for (const entry of Object.values(store)) {
    try {
      const el = document.querySelector(entry.selector);
      if (!el) continue;
      if (entry.current && el.textContent.trim() === entry.original) {
        el.textContent = entry.current;
        if (entry.current !== entry.original) el.classList.add('pfrev-edited');
      }
      if (entry.note) el.classList.add('pfrev-noted');
      el.dataset.pfrevOriginal = entry.original;
    } catch {
      /* selector no longer matches — skip */
    }
  }
}

function updateCount() {
  const n = Object.keys(loadStore()).length;
  if (countEl) countEl.textContent = `${n} change${n === 1 ? '' : 's'}`;
}

function clearChanges() {
  if (!window.confirm('Clear all review edits/notes on this page?')) return;
  localStorage.removeItem(pageKey());
  window.location.reload();
}

function exportChanges() {
  const store = loadStore();
  const entries = Object.values(store);
  if (!entries.length) {
    alert('No changes to export yet.');
    return;
  }
  const page = window.location.pathname.replace(/\.html$/, '') || '/';
  const stamp = new Date().toISOString();
  const md = [
    `# Porchfest review notes`,
    `Page: ${page}`,
    `Exported: ${stamp}`,
    '',
    ...entries.map((e, i) => {
      const lines = [`## ${i + 1}. ${e.tag}  \`${e.selector}\``];
      if (e.original !== e.current) {
        lines.push(`- original: "${e.original}"`);
        lines.push(`- updated:  "${e.current}"`);
      }
      if (e.note) lines.push(`- note: ${e.note}`);
      return lines.join('\n');
    }),
  ].join('\n');

  const safe = page.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
  download(`review-${safe}.json`, JSON.stringify({ page, exported: stamp, changes: entries }, null, 2));
  download(`review-${safe}.md`, md);
  navigator.clipboard?.writeText(md).catch(() => {});
  alert(`Exported ${entries.length} change(s).\nJSON + Markdown downloaded, Markdown copied to clipboard.`);
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { initReviewMode };
