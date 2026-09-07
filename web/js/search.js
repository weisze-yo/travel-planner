// §3.4 — SEARCH. A magnifier in the header every screen already has, and a
// top-anchored panel over the app's existing scrim.
//
// Neither candidate home is used, and both rejections are the reason this
// file exists at all:
//
//   not a sixth tab   five entries at 375px are 75px each; six make 62.5px
//                     and re-space every label in the app's most permanent
//                     surface, for a control used in BURSTS, not dwelt in.
//   not the strip     strip.js is ONE ranked slot. A permanent search box
//                     would win it forever and the warnings would lose
//                     their only home.
//
// TOP-anchored, not bottom, which is the one place this app's sheets go: the
// keyboard owns the lower half of the screen the moment the field takes
// focus, and the results have to be above it. The section says so out loud
// so it does not read as an inconsistency.
//
// It lives here rather than in a screen because five screens invoke it and
// its state must not belong to any of them — the same reason `#undo` is app
// chrome. nav.js mounts it once; screens contribute only the button.
import { html, raw, icon, esc } from './util.js';
import * as store from './store.js';
import { go } from './nav.js';

let slot = null;
let open = false;
let query = '';
/**
 * The record a result sent us to, waiting for its row to appear.
 *
 * Navigation repaints the destination screen a frame or two later, so the
 * row cannot be marked in the same task as the tap. This holds the target
 * until `claimFlash` finds it, and is cleared either way so a stale target
 * cannot mark an unrelated row on some later paint.
 */
let flash = null;
let flashTimer = null;

export function mount(host) {
  slot = host;
  if (!slot) return;
  slot.addEventListener('click', onClick);
  slot.addEventListener('input', onInput);
  slot.addEventListener('keydown', onKey);
  paint();
}

/** Opened from any screen's header button. */
export function openPanel() {
  open = true;
  query = '';
  paint();
  slot?.querySelector('#search-q')?.focus();
}

export function closePanel() {
  open = false;
  query = '';
  paint();
}

export const isOpen = () => open;

function onClick(event) {
  if (event.target.closest('[data-act="search-close"]')) { closePanel(); return; }
  if (event.target.closest('[data-act="search-clear"]')) {
    query = '';
    paint();
    slot.querySelector('#search-q')?.focus();
    return;
  }
  const hit = event.target.closest('[data-search-go]');
  if (!hit) return;
  const target = {
    id: hit.dataset.searchGo,
    rowKey: hit.dataset.rowKey,
    placeID: hit.dataset.placeId || null,
    panel: hit.dataset.panel,
  };
  closePanel();
  // `go('dest', …)` already knows how to reach a record; the flash is the
  // half that had to be built.
  go('dest', { placeID: target.placeID, panel: target.panel });
  armFlash(target);
}

function onInput(event) {
  if (event.target.id !== 'search-q') return;
  query = event.target.value;
  paint();
}

function onKey(event) {
  if (event.key === 'Escape') closePanel();
}

/*
 * THE FLASH, AND IT IS NOT AN ANIMATION FIRST.
 *
 * Default: the row's ground goes --jade-bg and fades to white over 2.4s.
 * Under `prefers-reduced-motion: reduce` there is no fade — the row takes
 * --jade-bg plus a 3px jade rule on its leading edge and simply STAYS
 * marked until the next tap or scroll clears it.
 *
 * Arguably the better of the two: outdoors in sun, a 2.4s wash is easy to
 * miss entirely, and a mark that waits for you cannot be.
 *
 * IT HAS TO SURVIVE A REPAINT. `nav.js` replaces the whole screen host on
 * every paint, so a class added once to a row is gone the next time the
 * store notifies — and on a 45-row list that happens between the navigation
 * and the eye. So the target is held HERE and re-applied after every paint
 * (nav.js calls `restoreFlash`), until it expires or is cleared.
 *
 * That is also what "stays until the next tap or scroll" requires: a mark
 * that waits minutes has to outlive whatever repaints happen while it waits.
 */
function armFlash(target) {
  flash = { ...target, until: reducedMotion() ? Infinity : Date.now() + 2600 };
  if (flashTimer) clearTimeout(flashTimer);
  let tries = 0;
  const look = () => {
    if (!flash) return;
    if (claimFlash()) return;
    tries += 1;
    // ~1.5s of frames. A record whose row never appears — a place whose stop
    // was removed, a panel that refused to render — gives up quietly rather
    // than leaving a timer running for the session.
    if (tries > 90) { flash = null; return; }
    requestAnimationFrame(look);
  };
  requestAnimationFrame(look);
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The row a live flash is about, if it is on screen. */
const flashRow = () => (flash
  ? document.querySelector(`[data-${flash.rowKey}="${cssEscape(flash.id)}"]`)
  : null);

function claimFlash() {
  if (!flash) return true;
  const row = flashRow();
  if (!row) return false;
  row.scrollIntoView({ block: 'center', behavior: 'auto' });
  mark(row);
  if (flash.until !== Infinity) {
    flashTimer = setTimeout(() => { flash = null; unmarkAll(); }, flash.until - Date.now());
  } else {
    // It waits for you — and goes on the next deliberate move.
    document.addEventListener('pointerdown', clearFlash, { once: true });
    row.closest('.scroll')?.addEventListener('scroll', clearFlash, { once: true });
  }
  return true;
}

/**
 * Re-apply the mark after a paint. Called by nav.js, because the flash is a
 * property of the app rather than of whichever screen is drawing.
 */
export function restoreFlash() {
  if (!flash) return;
  if (flash.until !== Infinity && Date.now() > flash.until) { flash = null; return; }
  const row = flashRow();
  if (row && !row.classList.contains('flashed')) mark(row);
}

function clearFlash() {
  flash = null;
  if (flashTimer) clearTimeout(flashTimer);
  unmarkAll();
}

const mark = (row) => row.classList.add('flashed');
const unmarkAll = () => document.querySelectorAll('.flashed')
  .forEach((el) => el.classList.remove('flashed'));

/** Enough escaping for an id used inside an attribute selector. */
const cssEscape = (v) => String(v).replace(/["\\]/g, '\\$&');

function paint() {
  if (!slot) return;
  if (!open) { slot.hidden = true; slot.innerHTML = ''; return; }
  const found = store.searchRecords(query);
  slot.hidden = false;
  slot.innerHTML = String(panel(found));
}

function panel(found) {
  return html`
    <div class="scrim" data-act="search-close"></div>
    <div class="search-panel">
      <div class="search-bar">
        <span class="search-mag" aria-hidden="true">${raw(icon.search ? icon.search('#6B7A74', 15) : '')}</span>
        <input id="search-q" value="${esc(found.query === query.trim().toLowerCase() ? query : query)}"
               placeholder="A name, in English or Japanese"
               autocomplete="off" autocapitalize="off" spellcheck="false"
               aria-label="Search this trip by name">
        ${query ? html`
          <button class="search-x" data-act="search-clear" aria-label="Clear">✕</button>` : ''}
        <button class="search-done" data-act="search-close">Done</button>
      </div>

      <!-- The head counts, always, in both directions: how many matched and
           out of how many records. A search that says "7" without saying "of
           688" has told you nothing about how much it looked at. -->
      <div class="search-head">
        ${found.tooShort
          ? `${found.total} RECORDS · TYPE TWO CHARACTERS`
          : `${found.matched} OF ${found.total} RECORDS${
            found.matched > found.shown ? ` · FIRST ${found.shown}` : ''}`}
      </div>

      ${found.tooShort
        // §3.4 · one character shows the head and NOTHING ELSE. A request
        // that has not been made yet is not a result of zero, so it gets no
        // list and no sentence.
        ? ''
        : (found.results.length ? html`
          <div class="search-list">
            ${found.results.map((r) => html`
              <button class="search-row${r.retired ? ' retired' : ''}"
                      data-search-go="${esc(r.id)}" data-row-key="${r.rowKey}"
                      data-place-id="${esc(r.placeID || '')}" data-panel="${r.panel}">
                <div class="row g6 center">
                  <span class="search-kind">${r.label}</span>
                  ${r.retired ? html`<span class="chip">RETIRED</span>` : ''}
                  ${r.priceTier && r.priceTier !== '—' ? html`
                    <span class="search-price">${r.priceTier}</span>` : ''}
                </div>
                <div class="search-name">${r.name}</div>
                ${r.nameJp ? html`<div class="search-jp">${r.nameJp}</div>` : ''}
                ${r.context ? html`<div class="search-ctx">${r.context}</div>` : ''}
              </button>`)}
          </div>` : html`
          <div class="search-empty">
            <div>Nothing matches “${found.query}”.</div>
            <div class="mt6">
              Names only — English or Japanese. Notes and prices are not searched.
            </div>
          </div>`)}
    </div>`;
}
