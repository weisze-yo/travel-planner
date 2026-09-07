// Screen 2h — Trip prep. The six-day forecast strip drives the outfit advice,
// each line can explain itself ("Day 4: 80% rain"), and every item carries a
// tag for where it is packed. Categories and items can both be added.

import { html, raw, icon, delegate, esc } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { checkbox, swipeToDelete, dayPills, searchButton } from './parts.js';
import { OUTFIT_PICKS } from '../data.js';
import { PACKED_LOCATIONS } from '../data.js';

let addingTo = null;
let categoryOpen = false;
/**
 * F1 · whether the outfit-prose editor is open. The owner answered YES to
 * "is an outfit record writable", so this is the one sheet Prep has.
 */
let writing = false;

export default {
  id: 'prep',
  tab: 'prep',

  render() {
    const groups = store.prepGroups();
    const progress = store.prepProgress();
    const gap = store.tripDayGap(state.trip);

    return html`
      <section class="screen">
        <div class="head">
          <!-- §3.4 · this header had no icon row, so it gains the one every
               other screen already has rather than the magnifier being
               dropped somewhere of its own. -->
          <div class="head-row">
            <div class="grow">
              <div class="screen-title">Trip prep</div>
              <div class="screen-sub">
                ${state.trip?.dayCount || 0} days${gap != null && gap > 0
                  ? ` · departs in ${gap} day${gap === 1 ? '' : 's'}` : ''}
              </div>
            </div>
            ${searchButton()}
          </div>
          <div class="progress mt12"><i style="width:${progress.percent}%"></i></div>
          <div class="f11 w650 muted mt6">${progress.packed} of ${progress.total} packed</div>
        </div>

        <div class="scroll" style="padding:12px 16px 24px">
          <div class="row g6 wrap mb12">${dayPills({ small: true })}</div>

          ${outfitCard()}

          ${groups.map((group) => html`
            <div class="card-list mb12">
              <div class="swipe-row swipe-flat" data-cat-row="${group.title}">
                <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete the ${group.title} category">${raw(icon.bin)}</button></div>
                <div class="swipe-face row g8 center between" style="padding:11px 14px">
                  <div class="f13 w700">${group.title}</div>
                  <div class="f11 w700 soft">
                    ${group.items.filter((i) => i.packed).length}/${group.items.length}
                  </div>
                </div>
              </div>

              ${group.items.map((item) => {
                const where = PACKED_LOCATIONS.find((l) => l.id === item.packedIn) || PACKED_LOCATIONS[0];
                const packedSomewhere = item.packedIn !== 'notPacked';
                return html`
                  <div class="swipe-row swipe-flat" data-prep-row="${item.id}" data-prep-name="${item.name}">
                    <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete ${item.name}">${raw(icon.bin)}</button></div>
                    <div class="swipe-face prep-item">
                    ${checkbox(item.packed, { act: 'tick', id: item.id, size: 21 })}
                    <button class="grow" style="text-align:left" data-act="tick" data-id="${item.id}">
                      <div class="prep-name${item.packed ? ' done' : ''}">${item.name}</div>
                      ${item.why ? html`<div class="prep-why">${item.why}</div>` : ''}
                    </button>
                      <button class="where-chip${packedSomewhere ? ' on' : ''}" data-act="where" data-id="${item.id}">
                        ${where.label}
                      </button>
                    </div>
                  </div>`;
              })}

              ${addingTo === group.title ? html`
                <div class="row g6" style="padding:11px 14px;border-top:1px solid var(--line-3)">
                  <input id="new-item" class="grow" placeholder="Item name">
                  <button class="btn jade none" style="width:58px;height:37px" data-act="item-save" data-cat="${group.title}">Add</button>
                  <button class="btn ghost none" style="width:37px;height:37px" data-act="item-cancel" aria-label="Cancel">✕</button>
                </div>` : ''}

              <button class="prep-add" data-act="item-open" data-cat="${group.title}">+ Add item</button>
            </div>`)}

          ${categoryOpen ? html`
            <div class="row g6 mb10">
              <input id="new-cat" class="grow" placeholder="Category name">
              <button class="btn jade none" style="width:58px;height:37px" data-act="cat-save">Add</button>
              <button class="btn none" style="width:37px;height:37px;background:#fff;color:var(--muted)" data-act="cat-cancel" aria-label="Cancel">✕</button>
            </div>` : ''}

          <button class="btn-dashed" data-act="cat-open">+ New category</button>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-day]', (el) => store.selectDay(Number(el.dataset.day)));
    // F1 · the outfit-prose sheet.
    delegate(root, '[data-act="outfit-write"]', () => { writing = true; store.touch(); });
    delegate(root, '[data-act="outfit-cancel"]', () => { writing = false; store.touch(); });
    delegate(root, '[data-act="outfit-save"]', () => {
      const blocks = {};
      for (const block of store.OUTFIT_BLOCKS) {
        blocks[block.key] = root.querySelector(`#outfit-${block.key}`)?.value ?? '';
      }
      // There is no refusal case: both boxes empty is a real answer — "I have
      // nothing to say about this day" — and it returns the card to its empty
      // state rather than leaving a label with nothing under it.
      store.saveOutfitProse(state.selectedDay, blocks);
      writing = false;
      store.touch();
    });
    delegate(root, '[data-act="outfit-remove"]', (el) => store.removeOutfitPiece(el.dataset.piece));
    delegate(root, '[data-act="outfit-pick"]', (el) => store.addOutfitPiece(el.dataset.piece));
    delegate(root, '[data-act="outfit-add"]', () => {
      const input = root.querySelector('#outfit-new');
      if (!input?.value.trim()) return;
      store.addOutfitPiece(input.value);
      input.value = '';
    });

    swipeToDelete(root, {
      rowSelector: '[data-prep-row]',
      name: (row) => row.dataset.prepName,
      label: () => 'Off the packing list for good',
      onDelete: (row) => store.deletePrepItem(row.dataset.prepRow),
    });

    swipeToDelete(root, {
      rowSelector: '[data-cat-row]',
      name: (row) => `the "${row.dataset.catRow}" group`,
      label: () => 'And every item filed under it',
      onDelete: (row) => store.deletePrepCategory(row.dataset.catRow),
    });

    delegate(root, '[data-act="tick"]', (el) => store.togglePrepItem(el.dataset.id));
    delegate(root, '[data-act="where"]', (el) => store.cyclePackedIn(el.dataset.id));

    delegate(root, '[data-act="item-open"]', (el) => { addingTo = el.dataset.cat; nudge(); });
    delegate(root, '[data-act="item-cancel"]', () => { addingTo = null; nudge(); });
    delegate(root, '[data-act="item-save"]', (el) => {
      const input = root.querySelector('#new-item');
      if (!input?.value.trim()) { addingTo = null; nudge(); return; }
      addingTo = null;
      store.addPrepItem(el.dataset.cat, input.value);
    });

    delegate(root, '[data-act="cat-open"]', () => { categoryOpen = true; nudge(); });
    delegate(root, '[data-act="cat-cancel"]', () => { categoryOpen = false; nudge(); });
    delegate(root, '[data-act="cat-save"]', () => {
      const input = root.querySelector('#new-cat');
      categoryOpen = false;
      if (input?.value.trim()) store.addPrepCategory(input.value);
      else nudge();
    });
  },
};

function nudge() {
  store.selectDay(state.selectedDay);
}

/**
 * What to wear, which is the same question as what to pack and now sits on
 * the same screen. The suggestion is read off the day's weather; what you
 * are actually bringing is your own record and is kept separate from it,
 * because the app guessing and you deciding are not the same list.
 */
// The outfit card was always per-day — outfitProse() and outfitFor() both
// read state.selectedDay — but this screen offered no way to change the day,
// so it only ever showed whichever one the Plan screen had been left on. The
// pills above the card are the same component the Plan screen uses, so the two
// stay in step rather than each keeping their own idea of "today".
//
// §3.2 · and what it shows is the day's two RESEARCHED paragraphs now, not a
// sentence derived from the forecast. They were in every one of the eight
// outfit records from the day Trip 12 landed and nothing read them — the
// same shape of miss as `stopSummary` before the Must tab.
function outfitCard() {
  const wx = store.weather();
  const prose = store.outfitProse();
  const mine = store.outfitFor()?.pieces || [];
  const picks = OUTFIT_PICKS.filter((p) => !mine.includes(p));

  return html`
    ${writing ? outfitSheet() : ''}
    <div class="card pad mb12">
      <div class="row g8 center">
        <div class="grow">
          <div class="eyebrow" style="font-size:11px">WHAT TO WEAR ON DAY ${state.selectedDay}</div>
          <!-- §3.2 · the day's own subject under the title, so two
               paragraphs about a backdrop have a named backdrop to be
               about. It is the day label the rest of the app already uses. -->
          ${store.day()?.areaSpan
            ? html`<div class="f115 muted mt2">${store.day().areaSpan}</div>` : ''}
        </div>
        <div class="f115 w700 none" style="color:var(--jade)">${wx ? `${wx.high} °C, ${wx.summary}` : ''}</div>
      </div>
      ${prose.length ? html`
        <!-- §3.2 · the two paragraphs, both OPEN and neither collapsed. They
             are 272-679 characters each and they are the only researched
             content on this screen, so this card is now the tallest thing on
             Prep, which is right. A hairline between them only when there
             are two: with one block present there is nothing to divide. -->
        ${prose.map((block, i) => html`
          ${i ? html`<div class="hairline"></div>` : ''}
          <div class="outfit-block${i ? '' : ' first'}">
            <div class="eyebrow" style="font-size:10.5px">${block.label}</div>
            <div class="outfit-prose mt6">${block.text}</div>
          </div>`)}
        <div class="row mt10">
          <button class="btn-ghost-line" data-act="outfit-write">Edit these notes</button>
        </div>` : html`
        <!-- §3.2-B · neither paragraph. Tier 2, the app's own .empty
             sentence INSIDE the card, with the ghost action F1 makes
             possible. Not the forecast-derived sentence that used to live
             here: a generic "layer up" line dressed a guess as advice, and
             on a day with no forecast it said "No forecast for this day
             yet", which is the emptiest possible answer on a card whose
             whole job is to answer this. -->
        <div class="empty mt10" style="text-align:left">
          Nothing written about this day’s clothing yet.
        </div>
        <div class="row mt8">
          <button class="btn-ghost-line" data-act="outfit-write">Write what to wear</button>
        </div>`}

      <div class="hairline"></div>

      <div class="eyebrow jade" style="font-size:11px">WHAT I AM ACTUALLY BRINGING</div>
      <!-- §3.2 · the relationship between the two halves of this card, stated
           once, because it is the only relationship there is: one is advice,
           the other is what you packed. -->
      <div class="f115 muted lh145 mt4">${
        mine.length
          ? `${mine.length} thing${mine.length === 1 ? '' : 's'}, against the ${
            prose.length === 2 ? 'two paragraphs' : (prose.length ? 'note' : 'day')} above`
          : 'Your record, kept separate from the advice above.'}</div>

      ${mine.length ? html`
        <div class="row g6 wrap mt10">
          ${mine.map((piece) => html`
            <button class="mine-chip" data-act="outfit-remove" data-piece="${piece}">
              ${piece}<span style="font-size:11px;opacity:.6">✕</span>
            </button>`)}
        </div>` : ''}

      <div class="row g6 mt10">
        <input id="outfit-new" class="grow" placeholder="Add a piece">
        <button class="btn jade none" style="width:58px;height:37px" data-act="outfit-add">Add</button>
      </div>

      ${picks.length ? html`
        <div class="row g6 wrap mt8">
          ${picks.map((p) => html`<button class="pick-chip" data-act="outfit-pick" data-piece="${p}">+ ${p}</button>`)}
        </div>` : ''}
    </div>`;
}

/**
 * F1 · writing your own clothing notes.
 *
 * The app's one sheet pattern, unchanged — scrim, bottom modal, form, jade
 * Save, 96px ghost Cancel. TWO textareas because the content is two KINDS,
 * labelled with the same words the card shows, so what you type appears
 * where you read it.
 *
 * A scrim is right here and would be wrong on §3.6's Add-a-stop form:
 * nothing behind THIS form is reference material you are typing against.
 *
 * `factsEditor`'s rule applies — leave a box empty and that block is not
 * kept — and it is said out loud in the hint rather than discovered.
 */
function outfitSheet() {
  const x = store.outfitFor()?.x || {};
  return html`
    <div class="scrim" data-act="outfit-cancel"></div>
    <div class="modal">
      <div class="form">
        <div class="form-title">What to wear on Day ${state.selectedDay}</div>
        ${store.OUTFIT_BLOCKS.map((block) => html`
          <div class="eyebrow" style="font-size:10.5px">${block.label}</div>
          <div class="f11 soft lh145" style="margin-top:-2px">${block.hint}</div>
          <textarea id="outfit-${block.key}" rows="5"
                    placeholder="${block.hint}">${esc(x[block.key] || '')}</textarea>`)}
        <div class="form-actions">
          <button class="btn jade grow" data-act="outfit-save">Save</button>
          <button class="btn ghost" style="width:96px" data-act="outfit-cancel">Cancel</button>
        </div>
        <div class="form-hint">Leave a box empty and that half is not kept.</div>
      </div>
    </div>`;
}
