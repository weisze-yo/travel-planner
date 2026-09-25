// Screen 2d — Nearby. No time gate: every place shows. Sort lives in an icon
// on the right of the count line (travel time or stay time only, since
// categories are their own filter row), multi-leg journeys are spelled out,
// and you can add a place yourself.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { backHeader, swipeToDelete, emptyShared } from './parts.js';
import { MODE_ICONS, MODE_LABELS, CATEGORY_LABELS } from '../data.js';

let sortOpen = false;
let addOpen = false;
let notice = '';
/**
 * Which control is doing async work — a key, never a free string (P0-5 R1).
 * The pending label never interpolates the name (§6): it is already on
 * screen, in the field it was typed into, and a long CJK name inside a button
 * would wrap or overflow.
 */
let pending = '';
/** The add-a-place form's refusal, in its own field, in rust. */
let addError = '';

/*
 * §3.7 · CATS was the ONE hardcoded copy of the category list in the app —
 * every other label derives from `CATEGORY_LABELS` — and it silently lied
 * the moment a value was added: `service` existed for a whole commit with no
 * chip, and `all` had to be spliced in by hand.
 *
 * It derives now. The chip row itself survives on THIS screen, which spans
 * a whole day and has the width for it; the Nearby TAB uses a select
 * instead, because seven chips in a horizontal scroller above a list inside
 * a tab inside a scrolling screen is four nested scroll surfaces.
 */
const CATS = ['all', ...Object.keys(CATEGORY_LABELS)];
const SORTS = [
  { id: 'travelTime', label: 'Travel time' },
  { id: 'stayTime', label: 'Stay time' },
];

export default {
  id: 'nearby',
  tab: 'map',

  render(params = {}) {
    // Opened from the Map it covers the whole day; opened from a stop it
    // covers that stop.
    const dayScope = Boolean(params.dayScope);
    const anchorName = params.anchorName || store.subRoute()?.anchorName || 'this stop';
    // Bug 10 · was `store.subRoute()?.anchorPlanItemID` — a PLAN ROW id
    // handed to a lookup that matches place ids, so the fallback path never
    // found anything. `loopAnchorPlaceID` resolves either shape.
    const anchorID = params.anchorID || store.loopAnchorPlaceID() || null;
    const groups = dayScope ? store.placesByStopForDay() : [];
    const places = dayScope ? [] : store.nearbyPlaces(anchorID);
    const anchorShared = !places.length && state.nearbyCategory === 'all' && store.isSharedEmptyKind('places');
    const dayTotal = groups.reduce((n, g) => n + g.places.length, 0);
    const loop = store.activeLoop();
    const loops = store.subRoutesFor();
    const schedule = store.loopSchedule(loop);
    const deadline = store.loopDeadline(loop);

    return html`
      <section class="screen">
        ${backHeader({
          title: dayScope ? `Around day ${state.selectedDay}` : `Around ${anchorName}`,
          sub: dayScope
            ? `${dayTotal} place${dayTotal === 1 ? '' : 's'} saved across today's stops`
            : (deadline ? `Back by ${store.clock(deadline)}` : 'Places you can reach from this stop'),
        })}
        <div class="head" style="padding-top:0;border-bottom:1px solid var(--line)">
          <div class="chiprow">
            ${CATS.map((c) => html`
              <button class="cat${c === state.nearbyCategory ? ' on' : ''}" data-cat="${c}">
                ${c === 'all' ? 'All' : CATEGORY_LABELS[c]}
              </button>`)}
          </div>
        </div>

        <div class="scroll" style="padding:12px 16px 156px">
          <div class="row g8 center mb10">
            <div class="grow f115 w700 muted">
              ${dayScope ? `grouped by stop` : `${places.length} places`} ·
              sorted by ${SORTS.find((s) => s.id === state.nearbySort).label.toLowerCase()}
            </div>
            <button class="sortbtn${sortOpen ? ' on' : ''}" data-act="sort-toggle" aria-label="Change sort">
              ${raw(icon.sort(sortOpen ? '#fff' : '#3D4C46'))}
            </button>
          </div>

          ${sortOpen ? html`
            <div class="sortmenu mb10">
              <div class="eyebrow" style="padding:6px 8px 4px">SORT BY</div>
              ${SORTS.map((s) => html`
                <button class="sortopt${s.id === state.nearbySort ? ' on' : ''}" data-sort="${s.id}">
                  <span class="radio${s.id === state.nearbySort ? ' on' : ''}"></span>
                  <span class="sortopt-label">${s.label}</span>
                </button>`)}
            </div>` : ''}

          ${notice ? html`<div class="amber-note f12 mb10">${notice}</div>` : ''}

          ${dayScope ? (dayTotal ? groups.map((group) => html`
            <div class="stop-group">
              <div class="stop-group-head">
                <span class="stop-group-time">${group.stop.time}</span>
                <span class="grow">${group.stop.name}</span>
                <span class="badge ${group.stop.kind === 'sub' ? 'sub' : 'main'}">
                  ${group.stop.kind === 'sub' ? 'SUB' : 'MAIN'}
                </span>
              </div>
              ${group.places.map((p) => card(p))}
            </div>`) : (store.isSharedEmptyKind('places') ? emptyShared({
              title: "Nothing saved around today's stops in the copy you were sent.",
            }) : html`
            <div class="empty">
              Nothing saved around today's stops yet.<br>
              Open a stop and use <b>+ Add a place</b> to start a list for it.
            </div>`)) : ''}

          ${dayScope ? '' : (places.length ? places.map((p) => card(p)) : (anchorShared
            ? emptyShared({ title: `Nothing saved around ${anchorName} in the copy you were sent.` })
            : html`
            <div class="empty">
              ${state.nearbyCategory === 'all'
                ? `Nothing saved around ${anchorName} yet.`
                : 'Nothing in this category here.'}<br>
              Add a place below and it shows up on the map.
            </div>`))}

          ${dayScope || anchorShared ? '' : html`
            ${addOpen ? addForm() : ''}
            <button class="btn-dashed" style="height:46px" data-act="add-open">+ Add a place</button>`}
        </div>

        <!--
          §3.7 · THE FIXED BOTTOM DOCK IS GONE, from this screen and from the
          Nearby tab.

          It existed to name "the loop in hand" — the loop the round + / ✓
          would drop a place into. A per-card select that NAMES its loop
          makes the concept unnecessary, so the switcher's job does not move
          anywhere, it disappears. The Arrange button's job went to the
          Plan, per the owner's instruction, and Start one with it: a sub
          route is created on the Plan, in the gap it belongs to.

          Day 1's amber line is the signpost when a day has no free time set
          aside at all.
        -->
      </section>`;
  },

  mount(root, params = {}) {
    swipeToDelete(root, {
      rowSelector: '[data-place-row]',
      name: (row) => row.dataset.placeName,
      label: () => 'Off your saved places, and out of any sub route',
      onDelete: (row) => store.deletePlace(row.dataset.placeRow),
    });

    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-cat]', (el) => store.setNearbyCategory(el.dataset.cat));
    delegate(root, '[data-act="sort-toggle"]', () => { sortOpen = !sortOpen; store.setNearbySort(state.nearbySort); });
    delegate(root, '[data-sort]', (el) => { sortOpen = false; store.setNearbySort(el.dataset.sort); });
    // §3.7 · `arrange` and `data-loop` went with the dock. Arranging is the
    // Plan's job now, and there is no "loop in hand" to switch between.
    // §3.7 · F5 (b) · a SET, not a toggle, and the loop is named.
    delegate(root, '[data-loop-for]', (el) => {
      store.setSubRoutePlace(el.dataset.loopFor, el.value || null, Number(el.dataset.day));
    }, 'change');
    // B4 · the Edit chip goes to the place's own screen, where the facts
    // sheet lives. This screen has no sheet of its own and §3.7 does not
    // give it one — a second copy of that sheet is the kind of duplication
    // this section exists to remove.
    delegate(root, '[data-edit-place]', (el) => go('dest', { placeID: el.dataset.editPlace }));
    delegate(root, '[data-open-place]', (el) => go('dest', { placeID: el.dataset.openPlace }));

    delegate(root, '[data-act="add-open"]', () => { addOpen = true; addError = ''; notice = ''; rerender(); });
    delegate(root, '[data-act="add-cancel"]', () => {
      if (pending) return;
      addOpen = false; addError = ''; rerender();
    });
    delegate(root, '[data-act="add-save"]', async (el) => {
      if (pending) return;
      const name = root.querySelector('#np-name')?.value.trim();
      if (!name) {
        addError = 'A name, or a map link.';
        rerender();
        root.querySelector('#np-name')?.focus();
        return;
      }
      addError = '';
      // Bug 10, second instance · same fault as the read path above, in the
      // handler that WRITES the anchor. A plan-row id stored as a place's
      // `anchorPlaceID` makes the new place unfindable the moment it saves.
      const anchorID = params.anchorID || store.loopAnchorPlaceID() || null;

      // R8: the form stays up until the work resolves — it used to close
      // here, leaving the pending line above a form that had gone.
      pending = /^https?:/i.test(name) ? 'link' : 'add';
      notice = '';
      rerender();

      const result = await store.capturePlace({
        input: name,
        category: root.querySelector('#np-cat')?.value || 'food',
        walkMinutes: root.querySelector('#np-walk')?.value,
        anchorPlaceID: anchorID,
      });

      if (!result.saved) {
        notice = result.reason;
      } else if (!result.located) {
        notice = `"${result.name}" was saved without a location, so it will not appear on the map `
          + 'or in the walking route. Nothing was found by that name nearby — try a fuller name, '
          + 'the street, or paste a map link.';
      } else {
        notice = result.enriched
          ? `"${result.name}" added, with what OpenStreetMap knows about it.`
          : '';
      }
      pending = '';
      // Only a saved place closes the form; a failure leaves it up with what
      // was typed still in it, so the retry is one tap.
      if (result.saved) addOpen = false;
      rerender();
    });
  },
};

/** Nudges the store so the screen repaints for local-only UI flags. */
function rerender() {
  store.setNearbyCategory(state.nearbyCategory);
}

function card(p) {
  /*
   * §3.7 · F5 (b) · membership is SINGULAR, and the select is the truth.
   *
   * `alsoIn` — the list of "in ‹loop›" chips that let one place sit in
   * several of a day's loops — is gone from both surfaces. A select cannot
   * express membership in several loops at once, and with five loops on Day
   * 7 that was not hypothetical. Choosing a second loop MOVES the place.
   */
  const dayNumber = store.dayForPlace(p.anchorPlaceID) ?? state.selectedDay;
  const loops = store.subRoutesFor(dayNumber);
  const mine = loops.find((l) => (l.placeIDs || []).includes(p.id)) || null;
  const picked = Boolean(mine);
  const travel = (p.legs || []).reduce((sum, l) => sum + l.minutes, 0);
  return html`
    <div class="swipe-row mb8" data-place-row="${p.id}" data-place-name="${p.name}">
      <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete ${p.name}">${raw(icon.bin)}</button></div>
      <div class="swipe-face nearby-card${picked ? ' picked' : ''}">
      <button class="nearby-thumb" data-open-place="${p.id}" aria-label="Open ${p.name}"></button>
      <div class="grow">
        <div class="row g6" style="align-items:baseline">
          <button class="nearby-name" style="text-align:left" data-open-place="${p.id}">${p.name}</button>
          <span class="nearby-price">${p.priceTier}</span>
        </div>
        <!-- B4 · the street, when OpenStreetMap named one. The note stays
             after it: on a researched place the note is the whole reason the
             place is in the list, and on a pasted one it is "Added from a
             map link", which the street then qualifies. -->
        <div class="nearby-note">
          ${store.categoryLabel(p.category)}${p.street ? ` · ${p.street}` : ''} · ${p.note}
        </div>
        <div class="row g5 center wrap mt6">
          ${p.latitude ? '' : html`
            <!-- N-11 · the same chip the Plan row already carries, shorter
                 because a Nearby card has no room for "· add a link" and the
                 card is one tap from the screen that fixes it. It comes OUT
                 of the metadata line: a consequence is not a footnote. The
                 words are the app's own — "no position", never "unlocated",
                 which is an internal word. -->
            <span class="chip amber">No position</span>`}
          ${(p.legs || []).map((leg) => html`
            <span class="leg"><span style="font-size:11px">${MODE_ICONS[leg.mode]}</span>${MODE_LABELS[leg.mode]} ${leg.minutes}</span>`)}
          <span class="leg-total">${store.duration(travel)}</span>
          <span class="leg-stay">stay ~${store.duration(p.stayMinutes)}</span>
          ${loops.length ? html`
            <!-- §3.7 · the same select the Nearby tab carries, so a place
                 assigned on one surface reads correctly on the other. -->
            <span class="sel-chip${mine ? ' mine' : ''}">
              <select data-loop-for="${p.id}" data-day="${dayNumber}"
                      aria-label="Which sub route ${p.name} is in">
                <option value=""${mine ? '' : ' selected'}>Saved only</option>
                ${loops.map((l) => html`
                  <option value="${l.id}"${l.id === mine?.id ? ' selected' : ''}>${l.name}</option>`)}
              </select>
            </span>` : ''}
          <!-- B4 · the Edit chip, carried onto this surface now that §3.7 is
               rebuilding the card anyway. -->
          <button class="edit-chip" data-edit-place="${p.id}"
                  aria-label="Correct ${p.name}">Edit</button>
          <!-- §3.1 · last in the chain here too. -->
          ${(() => {
            const tw = store.timeToken(p);
            if (!tw) return '';
            return html`
              <span class="tw${tw.plain ? ' plain' : ''}">
                ${tw.dot ? html`<span class="tw-dot ${tw.dot}" aria-hidden="true"></span>` : ''}${tw.label}
              </span>`;
          })()}
        </div>
      </div>
      </div>
    </div>`;
}

function addForm() {
  return html`
    <div class="form mb10">
      <div class="form-title">Add a place</div>
      <input id="np-name" placeholder="Name, or paste a Google / Apple Maps link">
      <div class="row g8">
        <label class="sel grow">
          <select id="np-cat">
            ${Object.entries(CATEGORY_LABELS).map(([id, label]) => html`<option value="${id}">${label}</option>`)}
          </select>
        </label>
        <input id="np-walk" placeholder="Walk min" style="width:104px" inputmode="numeric">
      </div>
      <div class="form-actions">
        <button class="btn jade grow" style="height:40px" data-act="add-save"${
          pending ? raw(' disabled aria-busy="true"') : ''}>${
          pending === 'link' ? 'Reading that link…' : (pending === 'add' ? 'Looking it up…' : 'Save')}</button>
        <button class="btn ghost" style="width:88px;height:40px" data-act="add-cancel">Cancel</button>
      </div>
      <div class="form-hint">
        A full map link brings the name and the position with it, and opening hours or a phone
        number when OpenStreetMap has them. Short <code>maps.app.goo.gl</code> links cannot be
        read by a browser — open one in Safari first and copy the full address.
      </div>
    </div>`;
}
