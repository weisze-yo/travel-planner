// Screen 2c — Destination. Need-to-know as a label/value table rather than
// icon soup, both map handoffs above it, and doorways into the things that
// hang off this stop: nearby, must-see, shopping, and the day's note.

import { html, raw, icon, delegate, money, esc } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { prepare } from '../photos.js';
import {
  backHeader, mapsLinks, swipeToDelete, emptyShared,
  itemEditor, readItemEditor, shotEditor, readShotEditor, factsEditor, readFactsEditor,
  readFactsLink, readFactsIdentity,
} from './parts.js';

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'nearby', label: 'Nearby' },
  { id: 'must', label: 'Must' },
  { id: 'shop', label: 'Shop' },
  { id: 'log', label: 'Notes' },
];

/**
 * Which tabs this subject can actually fill.
 *
 * Must and Shop records are anchored to a STOP, never to an individual
 * place: every mustSee and shopping record carries the stop's `placeID`, and
 * the five-line `stopSummary` is a field on the plan row. So on a nearby
 * place both tabs are not empty-for-now, they are empty by construction —
 * 532 screens each with two tabs that can never fill. A tab bar that says so
 * is the honest version, and the `linkrow` at the foot of the place's panels
 * is where the stop's own records are offered instead.
 *
 * The test is `isStopPlace`, not `kind === 'place'`. A stop reached by its
 * PLACE id — which is how the shop and must-see records themselves link, and
 * how `go('dest', { placeID })` arrives — resolves to a 'place' subject and is
 * still a stop; trimming its tabs would hide records that do point at it.
 */
const tabsFor = (it) => (store.isStopPlace(it.placeID)
  ? TABS
  : TABS.filter((t) => t.id === 'info' || t.id === 'nearby' || t.id === 'log'));

/** Which panel is showing. Point 7: the tabs stay on this screen. */
let tab = 'info';
/** The stop/place `tab` belongs to, so a genuinely different subject resets it. */
let tabSubject = null;
/**
 * Which Must sections are expanded. `do` starts open because the first
 * question at a stop is what the hour is for; the rest are a tap away, so
 * five paragraphs never arrive as a wall.
 */
let openLines = new Set(['do']);

/** Resolves whichever handle the caller had: a plan row, or a nearby place. */
export function subject(params = {}) {
  if (params.itemID) {
    const hit = store.planItem(params.itemID);
    if (hit) {
      return {
        kind: 'item',
        id: hit.item.id,
        // The Must tab reads the five-line summary off the plan row, so the
        // row's own id has to survive the resolve.
        itemID: hit.item.id,
        name: hit.item.name,
        subtitle: hit.item.subtitle,
        parent: null,
        summary: hit.item.summary || hit.item.note,
        window: store.itemWindow(hit.item).label,
        // The place owns these; a row only ever holds them before the
        // stop-is-a-place migration has run over it.
        essentials: store.place(hit.item.placeID)?.essentials?.length
          ? store.place(hit.item.placeID).essentials
          : (hit.item.essentials || []),
        placeID: hit.item.placeID,
        // A stop is a visit to a place, so everything hangs off the place.
        anchorID: hit.item.placeID,
        number: store.mainStopNumbers(store.day(hit.dayNumber))[hit.item.id],
        /*
         * Bug 6 · this read `hit.item.latitude` alone, and pasting a map
         * link writes the position to the PLACE (`setPlaceLink` -> `put
         * ('places', ...)`), never back onto the plan row. So the NO
         * POSITION strip and its "Paste a map link" button survived the
         * paste that was supposed to answer them, on the one screen that
         * offers the fix. The row's own coordinate still wins when it has
         * one — it is the stop's, and a stop may sit somewhere other than
         * the place it visits — with the place as the fallback.
         */
        coord: hit.item.latitude
          ? { lat: hit.item.latitude, lng: hit.item.longitude }
          : (store.place(hit.item.placeID)?.latitude
            ? {
              lat: store.place(hit.item.placeID).latitude,
              lng: store.place(hit.item.placeID).longitude,
            }
            : null),
      };
    }
  }
  if (params.placeID) {
    const p = store.place(params.placeID);
    if (p) {
      // A place is otherwise a name with no context. The stop it hangs off
      // is the answer to "why is this in my app", so it goes in the subtitle
      // the screen already renders, with the walk from the place's own legs.
      const parent = store.parentStopOf(p.id);
      const kindLine = `${store.categoryLabel(p.category)} · ${p.priceTier}`;
      return {
        kind: 'place',
        id: p.id,
        itemID: null,
        name: p.name,
        subtitle: parent
          ? `${kindLine} — ${parent.minutes ? `${store.duration(parent.minutes)} from ` : 'part of '}${parent.name}`
          : kindLine,
        parent,
        summary: p.note,
        window: '',
        essentials: p.essentials || [],
        placeID: p.id,
        // Every place is its own thing: its Nearby list, its shots, its
        // shopping — exactly what a stop shows, because a stop is one of these.
        anchorID: p.id,
        number: null,
        coord: p.latitude ? { lat: p.latitude, lng: p.longitude } : null,
      };
    }
  }
  // Default to the stop the sub route hangs off — the one with slack.
  const day = store.day();
  const anchorID = store.subRoute()?.anchorPlanItemID;
  const fallback = store.activeItems(day).find((i) => i.id === anchorID)
    || store.activeItems(day).find((i) => i.kind === 'main');
  return fallback ? subject({ itemID: fallback.id }) : null;
}

/** Which sheet is open over the panels, if any. */
let sheet = null;
/**
 * The open sheet's refusal, when its one required field is empty. Cleared
 * whenever a sheet opens or closes, so a refusal never outlives the form it
 * was about (`p1-destination-tabs-design.md` §6.2).
 */
let sheetError = '';
/** The facts sheet is async once a map link is in it. P0-5 R1 and R8. */
let sheetPending = false;
/**
 * Bug 13 · a picture chosen in the shot sheet but not yet saved.
 *
 * Picking a file used to call `store.addShot()` immediately, purely so the
 * image had a record to attach to — so a spot appeared on the stop the
 * instant a photo was chosen, and Cancel could not take it back. It was
 * reported as exactly that: "a spot added to must-see after I uploaded an
 * image although I have pressed Cancel."
 *
 * The thumbnail waits here instead. Nothing is written until Save, which is
 * what Cancel has to mean. `null` is "no pending change"; a string is the
 * new thumbnail; `''` is "the picture was removed" on an existing shot,
 * which has to be distinguishable from "unchanged".
 */
let pendingPhoto = null;
/**
 * §3.1 · whether the Nearby tab's Now filter is engaged. Off on open, and it
 * is a state of the list rather than a destination, so it does not survive
 * leaving the screen.
 */
let nowOnly = false;
/**
 * §3.7 · which category the Nearby tab is filtered to, or 'all'.
 *
 * The tab's ONE control. Reset on leaving the panel for the same reason the
 * Now filter is: a filter whose control is off screen is a list that lies.
 */
let cat = 'all';
/**
 * §3.7 · the Add-a-place form's own state, on the tab.
 *
 * `adding` is whether the form is open; `addError` is its refusal, in the
 * field it is about; `addPending` is which kind of async work is in flight
 * (P0-5 R1 — pending belongs to the control that started it, and R8 — the
 * surface stays up until the work resolves).
 */
let adding = false;
let addError = '';
let addPending = '';
/**
 * §3.3 · urls whose image failed to load in this session.
 *
 * Per-session and in memory on purpose: a photo that failed because the
 * traveller was underground should come back when they surface, and the next
 * launch is the natural moment to try again. It is keyed by url rather than
 * by record so one dead file does not blank a record's other images.
 */
const brokenShots = new Set();
const repaint = () => store.selectDay(state.selectedDay);

export default {
  id: 'dest',
  tab: 'map',

  render(params) {
    const it = subject(params);
    if (!it) {
      // N-12 · it used to be one `.empty` sentence on an otherwise blank
      // screen with NO HEADER — Destination's back control lives in
      // `.hero-back` inside the hero, which this branch never renders — so
      // the only way out was to leave the whole area by changing tab. It now
      // gets the same push chrome as every other push screen, names the
      // subject when the caller knew it, and offers the one action that can
      // actually be completed. Tier 2, and a ghost rather than an ink
      // primary: this is a recovery, not the user's next intention.
      const gone = params.anchorName || params.name || '';
      const fromNearby = Boolean(params.anchorID || params.fromNearby);
      return html`
        <section class="screen">
          ${backHeader({ title: 'That stop has gone', sub: state.trip?.name || 'This trip' })}
          <div class="scroll" style="padding:16px">
            <div class="empty" style="text-align:left">
              <div>${gone ? `${gone} is not on this trip any more.` : 'That stop is not on this trip any more.'}</div>
              <div class="mt6">
                It was removed from the plan. Everything else on the trip is untouched.
              </div>
            </div>
            <button class="btn ghost wide mt12" data-act="${fromNearby ? 'gone-back' : 'gone-plan'}">
              ${fromNearby ? 'Back to the places' : 'Back to the day'}
            </button>
          </div>
        </section>`;
    }

    // A different stop/place is a different subject: land back on Info
    // rather than carrying over whichever tab the last one was left on.
    const tabs = tabsFor(it);
    if (it.anchorID !== tabSubject) {
      tabSubject = it.anchorID;
      /*
       * §3.7 · unless the caller asked for a panel by name.
       *
       * The Nearby TAB is the managing surface now, so the two places that
       * used to send a traveller to the day-wide screen for a STOP's places
       * — the loop editor's "+ Add places", and creating a sub route from a
       * lane on the Plan — land here instead. They have to arrive on Nearby
       * rather than on Info, or the tap that meant "show me the places"
       * shows a facts table.
       */
      tab = tabs.some((entry) => entry.id === params.panel) ? params.panel : 'info';
      openLines = new Set(['do']);
      pendingPhoto = null;
      nowOnly = false;
      cat = 'all';
      adding = false;
      addError = '';
    }
    // Walking from a stop's Must tab into one of its places must not leave
    // `tab` pointing at a panel this subject has no tab for.
    if (!tabs.some((entry) => entry.id === tab)) tab = 'info';

    // Everything on this screen is scoped to this one stop.
    const shopHere = state.shopping.filter((row) => (
      row.placeID ? row.placeID === it.placeID : row.placeLabel === it.name
    ));
    const shots = store.shotsFor(it.anchorID);
    const places = store.nearbyPlaces(it.anchorID);
    // Item 04: every note about this place, whichever day it was written on.
    const notes = store.notesForPlace(it.placeID, { name: it.name });
    const counts = {
      info: 0,
      nearby: places.length,
      must: shots.length + store.summaryLines(it.itemID).length,
      shop: shopHere.length,
      log: notes.length,
    };

    const shot = store.heroImage(store.place(it.placeID) || it, brokenShots);

    return html`
      <section class="screen">
        <div class="scroll">
          <!--
            §3.3 · NO PHOTO MEANS NO SLOT.

            This was a 230px .hero.placeholder-hatch reading "Photo
            placeholder" on every single record — 618 places, of which 616
            have no image and 43 are stops, of which ZERO do. 228px of
            hatched diagonal stripes, on every stop of the trip, promising a
            picture that is not coming.

            With an image it is a 200px photo plus a 28px solid ink credit
            bar; without one there is no hero at all, and nothing is missing
            because nothing was promised. The back button gets a real 52px
            white bar instead of floating on a hatch, and the badges move
            into the name block, which is the block that owns the subject.

            .placeholder-hatch itself STAYS in the stylesheet:
            .nearby-thumb and the must-see photo block still use it, and
            there it is right — a 56px thumbnail is a slot in a row, not a
            promise of a picture.
          -->
          ${shot ? html`
            <div class="hero photo" data-hero>
              <img class="hero-img" src="${esc(shot.url)}" alt="${esc(shot.caption || it.name)}"
                   loading="lazy" decoding="async" data-hero-img>
              <div class="hero-wash"></div>
              <button class="hero-back" data-act="back" aria-label="Back">${raw(icon.back)}</button>
              <div class="hero-badges">
                ${it.number ? html`<span class="hero-badge">MAIN ROUTE · STOP ${it.number}</span>` : ''}
                ${it.window ? html`<span class="hero-badge light">${it.window}</span>` : ''}
              </div>
            </div>
            <!-- The whole bar is the tap target, and the ↗ says so. White on
                 --ink at 15.4:1 — never alpha over a photo whose brightness
                 nobody can predict. Same height whatever the licence, so the
                 layout does not jump between a CC0 record and a CC BY-SA
                 one. -->
            <a class="hero-credit" href="${esc(shot.sourcePage || shot.url)}"
               target="_blank" rel="noopener" data-hero>
              <span class="grow">${store.imageCredit(shot)}</span>
              <span class="hero-credit-go" aria-hidden="true">↗</span>
            </a>` : html`
            <div class="dest-bar">
              <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
            </div>`}

          <div class="dest-body">
            ${shot ? '' : html`
              <div class="row g6 wrap mb8">
                ${it.number ? html`<span class="hero-badge">MAIN ROUTE · STOP ${it.number}</span>` : ''}
                ${it.window ? html`<span class="hero-badge dark">${it.window}</span>` : ''}
              </div>`}
            <div class="dest-name">${it.name}</div>
            ${it.subtitle ? html`<div class="dest-sub">${it.subtitle}</div>` : ''}
            ${it.summary ? html`<div class="dest-desc">${it.summary}</div>` : ''}

            <div class="row g8 mt14">
              <a class="btn ink grow" href="${mapsLinks.google(it.name, it.coord)}" target="_blank" rel="noopener">Google Maps</a>
              <a class="btn ghost grow" href="${mapsLinks.apple(it.name, it.coord)}" target="_blank" rel="noopener">Apple Maps</a>
            </div>

            ${it.coord ? '' : html`
              <!-- N-11 · the strip's normal job in its normal shape, directly
                   under the two controls it is about: a position is exactly
                   what would make those two buttons work. A presentational
                   reuse of the .warn strip, not a fifth dayIssues() kind. -->
              <div class="warn">
                <div class="row g8 center">
                  <div class="grow">
                    <div class="warn-label">NO POSITION</div>
                    <div class="warn-fact">The map cannot place this one, so it is off the route too.</div>
                  </div>
                  <!-- Its own action, not the Info tab's edit-facts: two
                       controls with one action made the pair ambiguous both
                       to a reader and to a selector. See the note in the
                       commit about the field this cannot open at. -->
                  <button class="warn-fix first" data-act="fix-position">Paste a map link</button>
                </div>
              </div>`}

            <div class="dest-tabs">
              ${tabs.map((entry) => html`
                <button class="dest-tab${entry.id === tab ? ' on' : ''}" data-panel="${entry.id}">
                  ${entry.label}${counts[entry.id] ? html` <span class="tab-count">${counts[entry.id]}</span>` : ''}
                </button>
              `)}
            </div>
          </div>

          <div style="padding:14px 16px 24px">
            ${panel(tab, it, { shopHere, shots, places, notes })}
          </div>
        </div>

        ${sheetMarkup(it, shopHere, shots)}
      </section>`;
  },

  mount(root, params) {
    const it = subject(params);
    delegate(root, '[data-act="back"]', () => back());
    /*
     * §3.3 · a photo that does not arrive must not leave a hole.
     *
     * These are Wikimedia URLs and this app is used on a phone in a country
     * the traveller does not live in — no signal, a captive portal, a dead
     * CDN, a file deleted from Commons.
     *
     * The first version of this REMOVED the hero and the credit bar from the
     * DOM, which the live check caught doing something worse than the hole
     * it fixed: the back button lives inside the hero when there is a photo,
     * so removing it left a screen with no way off it. Recording the failed
     * url and repainting means the render takes the no-photo branch
     * properly — the 52px white bar, the badges in the name block — which is
     * a complete design rather than a stripped one.
     */
    root.querySelector('[data-hero-img]')?.addEventListener('error', (event) => {
      const url = event.target.getAttribute('src');
      if (!url || brokenShots.has(url)) return;
      brokenShots.add(url);
      repaint();
    }, { once: true });

    delegate(root, '[data-act="now-toggle"]', () => { nowOnly = !nowOnly; repaint(); });
    delegate(root, '[data-panel]', (el) => {
      tab = el.dataset.panel;
      // Leaving the panel drops both filters: they describe this list, and a
      // filter you cannot see the control for is a list that lies.
      nowOnly = false;
      cat = 'all';
      adding = false;
      addError = '';
      // Repaint through the store so the whole screen re-renders once.
      store.selectDay(state.selectedDay);
    });

    // Panels that lead somewhere still can.
    /*
     * §3.7 · both doorways are gone.
     *
     * `arrange` belonged to the fixed bottom dock, which existed to name
     * "the loop in hand" — a concept a per-card select makes unnecessary.
     * `all-nearby` was "Manage places for this stop", a doorway from a
     * managing surface to a second copy of itself. Arranging goes to the
     * Plan; everything else happens in the panel.
     */
    delegate(root, '[data-act="to-plan"]', () => go('plan'));
    delegate(root, '[data-act="np-open"]', () => {
      adding = true; addError = ''; addPending = ''; repaint();
    });
    delegate(root, '[data-act="np-cancel"]', () => {
      if (addPending) return;
      adding = false; addError = ''; repaint();
    });
    delegate(root, '[data-act="np-save"]', async (el) => {
      if (addPending) return;
      const typed = root.querySelector('#np-name')?.value.trim() || '';
      // A refusal in the field it is about, in rust, with the button left
      // live: this app does not pre-disable, it refuses out loud.
      if (!typed) {
        addError = 'A name, or a map link.';
        repaint();
        root.querySelector('#np-name')?.focus();
        return;
      }
      addError = '';
      addPending = /^https?:/i.test(typed) ? 'link' : 'add';
      repaint();
      const result = await store.capturePlace({
        input: typed,
        category: root.querySelector('#np-cat')?.value || 'food',
        walkMinutes: Number(root.querySelector('#np-walk')?.value) || 5,
        anchorPlaceID: el.dataset.anchor || it?.placeID || null,
      });
      addPending = '';
      if (!result.saved) {
        // R8 · the form stays up with what was typed still in it, so the
        // retry is one tap rather than a re-type.
        addError = result.reason;
        repaint();
        root.querySelector('#np-name')?.focus();
        return;
      }
      adding = false;
      repaint();
    });
    delegate(root, '[data-act="cat-pick"]', (el) => { cat = el.value; repaint(); }, 'change');
    // §3.7 · F5 (b) · a SET, not a toggle. Choosing a second loop MOVES the
    // place; choosing "Saved only" takes it out of every loop on the day.
    delegate(root, '[data-loop-for]', (el) => {
      store.setSubRoutePlace(el.dataset.loopFor, el.value || null, Number(el.dataset.day));
    }, 'change');
    delegate(root, '[data-act="all-shop"]', () => go('shop'));
    delegate(root, '[data-line]', (el) => {
      const key = el.dataset.line;
      if (openLines.has(key)) openLines.delete(key);
      else openLines.add(key);
      repaint();
    });
    delegate(root, '[data-open-parent]', (el) => go('dest', { itemID: el.dataset.openParent }));
    delegate(root, '[data-act="gone-plan"]', () => go('plan'));
    delegate(root, '[data-act="gone-back"]', () => back());

    // --- the three sheets: a shopping item, a must-see spot, and the table.
    delegate(root, '[data-edit-item]', (el) => { sheet = { kind: 'item', id: el.dataset.editItem }; sheetError = ''; repaint(); });
    delegate(root, '[data-act="add-item"]', () => { sheet = { kind: 'item', id: null }; sheetError = ''; repaint(); });
    delegate(root, '[data-act="item-cancel"]', () => { sheet = null; sheetError = ''; repaint(); });
    delegate(root, '[data-act="item-save"]', () => {
      const patch = readItemEditor(root);
      // Was `if (!patch) return;` — Save on a nameless item did nothing at
      // all: no message, no field, no closed sheet. It now answers.
      if (!patch) {
        sheetError = 'What is it? One word is enough.';
        repaint();
        root.querySelector('#edit-name')?.focus();
        return;
      }
      sheetError = '';
      if (sheet.id) store.updateShoppingItem(sheet.id, patch);
      // ITEM 4 · added here, it stays here: local to this place until it is
      // ticked bought or put on the list from this same tab.
      else {
        store.addShoppingItem({
          ...patch, placeID: it?.placeID, placeLabel: patch.placeLabel || it?.name, local: true,
        });
      }
      sheet = null;
    });

    delegate(root, '[data-edit-shot]', (el) => {
      sheet = { kind: 'shot', id: el.dataset.editShot }; sheetError = ''; pendingPhoto = null; repaint();
    });
    delegate(root, '[data-act="add-shot"]', () => {
      sheet = { kind: 'shot', id: null }; sheetError = ''; pendingPhoto = null; repaint();
    });
    // Bug 13 · Cancel throws the pending picture away with the sheet, and
    // nothing was ever written, so nothing has to be undone.
    delegate(root, '[data-act="shot-cancel"]', () => {
      sheet = null; sheetError = ''; pendingPhoto = null; repaint();
    });
    delegate(root, '[data-act="shot-photo-clear"]', () => {
      // '' rather than null: on an existing shot this has to mean "remove
      // the saved picture on Save", which is different from "unchanged".
      pendingPhoto = '';
      repaint();
    });
    root.querySelector('#shot-photo')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file || !sheet) return;
      // The reference picture is a thumbnail on the phone, the same route a
      // Log photo takes when there is no Storage bucket to put it in.
      const { thumbnail } = await prepare(file);
      pendingPhoto = thumbnail;
      repaint();
    });
    delegate(root, '[data-act="shot-save"]', () => {
      const patch = readShotEditor(root);
      if (!patch) {
        sheetError = 'What the shot is — a few words.';
        repaint();
        root.querySelector('#shot-title')?.focus();
        return;
      }
      sheetError = '';
      // Only send imagePath when a picture was actually chosen or removed,
      // so saving an edit that did not touch the photo leaves it alone.
      const photo = pendingPhoto === null ? {} : { imagePath: pendingPhoto || null };
      if (sheet.id) store.updateShot(sheet.id, { ...patch, ...photo });
      else store.addShot({ placeID: it?.placeID, ...patch, ...photo });
      sheet = null;
      pendingPhoto = null;
    });

    delegate(root, '[data-act="edit-facts"]', () => {
      sheet = { kind: 'facts', id: null }; sheetError = ''; sheetPending = false; repaint();
    });
    // B4 · the Edit chip on a nearby card. Same sheet, a different subject.
    delegate(root, '[data-edit-place]', (el) => {
      sheet = { kind: 'facts', id: el.dataset.editPlace };
      sheetError = ''; sheetPending = false; repaint();
    });
    delegate(root, '[data-act="fix-position"]', () => {
      sheet = { kind: 'facts', id: null }; sheetError = ''; sheetPending = false; repaint();
    });
    delegate(root, '[data-act="facts-cancel"]', () => {
      if (sheetPending) return;
      sheet = null; sheetError = ''; repaint();
    });
    delegate(root, '[data-act="facts-save"]', async () => {
      if (sheetPending) return;
      const rows = readFactsEditor(root);
      const link = readFactsLink(root);
      const identity = readFactsIdentity(root);
      // Every write below goes to the sheet's OWN subject, not the screen's:
      // the Edit chip can open a nearby place's sheet from its stop, and
      // saving it must not rewrite the stop instead.
      const target = factsSubject(it)?.id || it?.placeID;
      const was = store.place(target)?.sourceLink || '';

      // Bugs 7 and 8 · a place must keep a name, so an emptied field is a
      // refusal in the field rather than a place with no label.
      if (!identity.name) {
        sheetError = 'It needs a name — anything you will recognise.';
        repaint();
        root.querySelector('#facts-name')?.focus();
        return;
      }

      // The typed rows are the user's own and are written first, so a link
      // that cannot be read never costs them the rest of the edit.
      store.updatePlaceIdentity(target, identity);
      store.updatePlaceFacts(target, rows);

      if (link === was) { sheet = null; sheetError = ''; repaint(); return; }

      // A link is looked up, which is the network, which is a pending state on
      // the control that started it (P0-5 R1) and a sheet that stays up until
      // it resolves (R8).
      sheetPending = true;
      sheetError = '';
      repaint();
      const result = await store.setPlaceLink(target, link);
      sheetPending = false;
      if (!result.ok) {
        // The same refusal a bad link gets anywhere else in the app, in the
        // field it is about, in rust — never a silent close.
        sheetError = result.reason;
        repaint();
        root.querySelector('#facts-link')?.focus();
        return;
      }
      sheet = null;
      sheetError = '';
      repaint();
    });

    // ITEM 4 · this is the ONLY place a shopping item is really deleted, so
    // it says so. The main list's swipe only takes an item off the list.
    swipeToDelete(root, {
      rowSelector: '[data-shop-row]',
      name: (el) => el.dataset.shopName,
      label: () => 'Gone for good — this is the only copy',
      onDelete: (el) => store.deleteShoppingItem(el.dataset.shopRow),
    });
    delegate(root, '[data-act="list-item"]', (el) => store.listShoppingItem(el.dataset.id));
    delegate(root, '[data-act="unlist-item"]', (el) => store.unlistShoppingItem(el.dataset.id));
    swipeToDelete(root, {
      rowSelector: '[data-shot-row]',
      name: (el) => el.dataset.shotName,
      label: () => 'Gone from this place for good',
      onDelete: (el) => store.deleteShot(el.dataset.shotRow),
    });
    delegate(root, '[data-act="note"]', () => go('note', {
      dayNumber: state.selectedDay, placeID: it?.placeID, placeName: it?.name,
    }));
    delegate(root, '[data-edit-note]', (el) => go('note', {
      noteID: el.dataset.editNote, dayNumber: Number(el.dataset.noteDay),
    }));
    /*
     * §3.7 · SWIPE-TO-DELETE STAYS on the tab. It is a gesture, not a
     * control — it costs zero pixels — and a managing surface you cannot
     * delete from is not one. It is also the only real delete for a place:
     * the sub-route select only decides which loop it belongs to.
     */
    swipeToDelete(root, {
      rowSelector: '[data-place-row]',
      name: (el) => el.dataset.placeName,
      label: () => 'Gone from this stop, and from any sub route it was in',
      onDelete: (el) => store.deletePlace(el.dataset.placeRow),
    });
    swipeToDelete(root, {
      rowSelector: '[data-pnote-row]',
      name: () => 'this note',
      label: () => `Gone from ${it?.name || 'this place'} and the Log for good`,
      onDelete: (el) => store.deleteLogEntry(el.dataset.pnoteRow),
    });
    delegate(root, '[data-act="tick-shot"]', (el) => store.toggleShot(el.dataset.id));
    delegate(root, '[data-act="tick-item"]', (el) => store.toggleBought(el.dataset.id));
    // Point: the "+" works from inside a stop too, not only on the Nearby screen.

    delegate(root, '[data-open-place]', (el) => go('dest', { placeID: el.dataset.openPlace }));
  },
};

// ------------------------------------------------------------------ panels

function panel(which, it, { shopHere, shots, places, notes }) {
  if (which === 'nearby') return nearbyPanel(it, places);
  if (which === 'must') return mustPanel(it, shots);
  if (which === 'shop') return shopPanel(it, shopHere);
  if (which === 'log') return logPanel(it, notes);
  return infoPanel(it);
}

function infoPanel(it) {
  if (!it.essentials.length) {
    if (store.isSharedEmptyKind('places')) {
      return emptyShared({
        title: `Nothing filled in for ${it.name} in the copy you were sent.`,
        action: { act: 'edit-facts', label: 'Write what you know' },
      });
    }
    return html`
      <div class="card pad">
        <div class="eyebrow">NEED TO KNOW</div>
        <div class="f125 muted lh145 mt6">
          Nothing here yet. Pasting a map link fills in whatever OpenStreetMap has — hours,
          phone, website — and the rest is yours to type.
        </div>
        <button class="btn-dashed mt12" data-act="edit-facts">Write what to remember</button>
      </div>
      ${parentHandoff(it)}`;
  }
  return html`
    <div class="card-list">
      ${it.essentials.map((row) => html`
        <div class="essential">
          <div class="essential-k">${row.key}</div>
          <div class="grow">
            <div class="essential-v">${row.value}</div>
            ${row.detail ? html`<div class="essential-d">${row.detail}</div>` : ''}
          </div>
        </div>`)}
    </div>
    <button class="btn ghost wide mt10" data-act="edit-facts">Correct or add to this</button>
    ${parentHandoff(it)}`;
}

function nearbyPanel(it, places) {
  const dayNumber = store.dayForPlace(it.placeID) ?? state.selectedDay;
  const loops = store.subRoutesFor(dayNumber);
  const shared = !places.length && store.isSharedEmptyKind('places');
  /*
   * §3.1 · the Now filter, and the count line above it.
   *
   * DEFAULT OFF, deliberately. A filter that silently hid six of a
   * traveller's own saved places on first open would be worse than the mark
   * it replaces — you would not know they were gone.
   *
   * The counts come off the WHOLE list, never the filtered one, or the row
   * that says "6 hidden" would be counting rows it had already removed.
   */
  const clockNow = store.openNowCount(places, dayNumber);
  const offHours = store.offHoursCount(places);
  const byCat = cat === 'all' ? places : places.filter((p) => p.category === cat);
  const rows = nowOnly ? byCat.filter((p) => store.openAtClock(p, clockNow.at, dayNumber)) : byCat;
  // §3.7 · the categories PRESENT, not all seven: a filter offering an option
  // that empties the list is a control that lies about what is here.
  const cats = [...new Set(places.map((p) => p.category).filter(Boolean))]
    .sort((a, b) => String(store.categoryLabel(a)).localeCompare(String(store.categoryLabel(b))));

  return html`
    ${places.length ? html`
      <!--
        §3.7 · ONE control row. The category select, and §3.1's Now beside it.
        Sort is NOT here: within one stop everything is 2-15 minutes away and
        the list is already distance-ordered, so category is the question
        people actually ask. Sort stays on the day-wide screen, where travel
        time means something again.

        A select rather than a chip row, which was drawn and rejected: seven
        30px chips in a horizontal scroller, above a list, inside a tab,
        inside a scrolling screen is four nested scroll surfaces. One 26px
        select is also §3.5's inline recipe earning its keep.
      -->
      <div class="row g8 center mb10">
        ${cats.length > 1 ? html`
          <span class="sel-chip none">
            <select data-act="cat-pick" aria-label="Show one category">
              <option value="all"${cat === 'all' ? ' selected' : ''}>All ${places.length}</option>
              ${cats.map((c) => html`
                <option value="${c}"${c === cat ? ' selected' : ''}>${
                  store.categoryLabel(c)} ${places.filter((p) => p.category === c).length}</option>`)}
            </select>
          </span>` : ''}
        <div class="grow f115 w700 muted">
          ${nowOnly
            ? `${clockNow.open} of ${clockNow.total} open at ${store.clock(clockNow.at)}`
            : (cat === 'all'
              ? `${places.length} place${places.length === 1 ? '' : 's'}${
                offHours ? ` · ${offHours} open only at dawn or night` : ''}`
              : `${rows.length} of ${places.length}`)}
        </div>
        ${offHours ? html`
          <button class="tw-now${nowOnly ? ' on' : ''}" data-act="now-toggle"
                  aria-pressed="${nowOnly ? 'true' : 'false'}">Now</button>` : ''}
      </div>

      ${loops.length ? '' : html`
        <!-- §3.7 · a day with no sub routes gets NO select on its cards. A
             dropdown whose only option is its own empty state is a dead
             control that teaches the traveller the app is broken. One
             .warn-class line instead, and it names the tap, as every
             warning in this app does. -->
        <div class="warn mb10">
          <div class="warn-label">NO FREE TIME YET</div>
          <div class="warn-fact">
            No free time is set aside on Day ${dayNumber} yet. Set some with the pencil on the
            Plan and these places can go into it.
          </div>
        </div>`}

      <div class="col g8">
        ${rows.map((place) => nearbyCard(place, loops, dayNumber))}
      </div>
      ${nowOnly && clockNow.hidden ? html`
        <!-- §3.1 · the filter is a STATE of the list, never a destination, so
             it says what it hid and offers the way back in the same row. And
             it says the reassuring half out loud: they have not gone. -->
        <div class="tw-hidden">
          <div class="grow">
            ${clockNow.hidden} hidden — open at dawn or after dark.
            They are still here tomorrow morning.
          </div>
          <button class="tw-show" data-act="now-toggle">Show</button>
        </div>` : ''}
      ${!rows.length && cat !== 'all' && !nowOnly ? html`
        <div class="empty">Nothing saved here under ${store.categoryLabel(cat)}.</div>` : ''}
    ` : (shared
      ? emptyShared({ title: `Nothing saved around ${it.name} in the copy you were sent.` })
      : html`<div class="empty">Nothing saved around this stop yet.</div>`)}

    <!-- §3.7 · "Manage places for this stop" dies as a DOORWAY. Everything
         it led to is here: the filter, the adding, the categorising, the
         deleting and the sub-route assignment. The words are "+ Add a
         place", and it opens the form in place. -->
    ${shared ? '' : (adding ? '' : html`
      <button class="btn-dashed mt10" data-act="np-open">+ Add a place</button>`)}

    ${it.kind === 'place' ? parentHandoff(it) : ''}

    ${adding ? addPlaceForm(it.placeID) : ''}

    ${loops.length && it.kind !== 'place' ? html`
      <!--
        §3.7 · the day's sub routes as a READ-ONLY dark card at the foot.
        Its only action is a way to the Plan, because the owner moved
        arranging and timing there — a dark card with drag handles would
        quietly move it back.
      -->
      <div class="loop-foot mt14">
        <div class="row g8 center">
          <div class="eyebrow grow loop-foot-eyebrow">FREE TIME ON DAY ${dayNumber}</div>
          <div class="f11 w800 loop-foot-eyebrow">${loops.length} SUB ROUTE${
            loops.length === 1 ? '' : 'S'}</div>
        </div>
        ${loops.map((l) => html`
          <div class="loop-foot-row">
            <div class="loop-foot-at">${store.clock(store.loopStart(l) ?? 0)}</div>
            <div class="grow loop-foot-name">${l.name}</div>
            <div class="loop-foot-n">${(l.placeIDs || []).length} place${
              (l.placeIDs || []).length === 1 ? '' : 's'}</div>
          </div>`)}
        <div class="loop-foot-note">Arranging and timing them happens on the Plan.</div>
        <button class="loop-foot-go" data-act="to-plan">Open Plan</button>
      </div>` : ''}`;
}

/**
 * §3.7 · Add a place, in the panel rather than through a doorway.
 *
 * The same dim-and-stick treatment §3.6 gave Add-a-stop, and for the same
 * reason: the list behind this form is the thing you are adding TO, and how
 * far the other places are is what tells you whether this one belongs. A
 * scrim would hide exactly that.
 */
function addPlaceForm(anchorPlaceID) {
  return html`
    <div class="dock-form">
      <div class="form">
        <div class="form-title">Add a place</div>
        <input id="np-name" placeholder="Name, or paste a Google / Apple Maps link">
        ${addError ? html`
          <div class="f11 lh145" style="color:var(--danger-fg);margin-top:-4px">${addError}</div>` : ''}
        <div class="row g8">
          <label class="sel grow">
            <select id="np-cat" aria-label="What kind of place">
              ${Object.entries(store.CATEGORY_LABELS).map(([id, label]) => html`
                <option value="${id}"${id === 'food' ? ' selected' : ''}>${label}</option>`)}
            </select>
          </label>
          <label class="none">
            <span class="f11 soft">Walk</span>
            <input id="np-walk" placeholder="min" style="width:76px" inputmode="numeric">
          </label>
        </div>
        <div class="form-actions">
          <button class="btn jade grow" data-act="np-save" data-anchor="${anchorPlaceID || ''}"${
            addPending ? raw(' disabled aria-busy="true"') : ''}>${
            addPending === 'link' ? 'Reading that link…' : (addPending ? 'Looking it up…' : 'Add')}</button>
          <button class="btn ghost" style="width:96px${
            addPending ? ';pointer-events:none' : ''}" data-act="np-cancel">Cancel</button>
        </div>
        <div class="form-hint">
          It is saved against this stop. A map link brings the position with it, and the
          opening hours where OpenStreetMap has them.
        </div>
      </div>
    </div>`;
}

/**
 * §3.7 · one nearby card. The round + / ✓ is gone; a sub-route SELECT on the
 * card's second chip line replaces it, and it says WHICH loop rather than
 * only that there is one.
 */
function nearbyCard(place, loops, dayNumber) {
  const mine = loops.find((l) => (l.placeIDs || []).includes(place.id)) || null;
  const travel = (place.legs || []).reduce((sum, leg) => sum + leg.minutes, 0);
  return html`
    <div class="swipe-row" data-place-row="${place.id}" data-place-name="${esc(place.name)}">
      <div class="swipe-bin">
        <button class="bin" data-swipe-delete aria-label="Delete ${place.name}">${raw(icon.bin)}</button>
      </div>
      <div class="swipe-face nearby-card${mine ? ' picked' : ''}">
        <button class="nearby-thumb" data-open-place="${place.id}" aria-label="Open ${place.name}"></button>
        <div class="grow">
          <div class="row g6" style="align-items:baseline">
            <button class="nearby-name" style="text-align:left" data-open-place="${place.id}">${place.name}</button>
            <span class="nearby-price">${place.priceTier}</span>
          </div>
          <!-- B4 · the second line carries the STREET when one is known:
               WHERE, rather than which postcode. It is only ever a street
               OpenStreetMap named, never the third comma-segment of a flat
               address string, which is exactly the guess that made the
               reported case wrong. -->
          <div class="nearby-note">
            ${store.categoryLabel(place.category)}${
              place.street ? ` · ${place.street}` : ''} · ${store.duration(travel)} away
          </div>
          <div class="row g5 center wrap mt6">
            ${loops.length ? html`
              <!-- §3.7 · F5 (b) · membership is SINGULAR, so this is a
                   select and not a set of ticks. "Saved only" is grey and is
                   a real, common, correct answer — most saved places belong
                   to no loop. A chosen loop is amber, which already means
                   "a sub route, planned by you". -->
              <span class="sel-chip${mine ? ' mine' : ''}">
                <select data-loop-for="${place.id}" data-day="${dayNumber}"
                        aria-label="Which sub route ${place.name} is in">
                  <option value=""${mine ? '' : ' selected'}>Saved only</option>
                  ${loops.map((l) => html`
                    <option value="${l.id}"${l.id === mine?.id ? ' selected' : ''}>${l.name}</option>`)}
                </select>
              </span>` : ''}
            ${place.latitude ? '' : html`
              <!-- N-11 · the same chip the Plan row carries. -->
              <span class="chip amber">No position</span>`}
            <button class="edit-chip" data-edit-place="${place.id}"
                    aria-label="Correct ${place.name}">Edit</button>
            <!-- §3.1 · LAST in the chain, always, so every token on a 31-row
                 list is found in one vertical scan down the right edge of
                 the chip row. -->
            ${(() => {
              const tw = store.timeToken(place);
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

function mustPanel(it, shots) {
  const lines = store.summaryLines(it.itemID);
  if (!lines.length && !shots.length) {
    if (store.isSharedEmptyKind('mustSee')) {
      return emptyShared({
        title: `Nothing noted for ${it.name} in the copy you were sent.`,
      });
    }
    return html`
      <div class="empty">Nothing noted for this stop yet.</div>
      <button class="btn-dashed mt12" data-act="add-shot">+ A shot worth getting here</button>`;
  }

  return html`
    <div class="col g8">
      ${lines.map((line) => {
        const open = openLines.has(line.key);
        const withShots = line.key === 'see' && shots.length;
        return html`
          <div class="must-sec must-${line.key}${open ? ' open' : ''}">
            <button class="must-head" data-line="${line.key}"
                    aria-expanded="${open ? 'true' : 'false'}">
              <span class="must-label">${line.label}</span>
              <span class="must-peek grow">${open ? '' : line.text}</span>
              ${withShots ? html`<span class="chip">${shots.length}</span>` : ''}
              <span class="must-caret">${open ? '\u2212' : '+'}</span>
            </button>
            ${open ? html`
              <div class="must-body">
                <div class="must-text">${line.text}</div>
                ${withShots ? shotCards(shots) : ''}
              </div>` : ''}
          </div>`;
      })}
      ${lines.some((l) => l.key === 'see') ? '' : shotCards(shots)}
    </div>
    <button class="btn-dashed mt12" data-act="add-shot">+ A shot worth getting here</button>`;
}

/**
 * The stop's own Must and Shop records, offered from a place that sits under
 * it — as a count and a way back, never as borrowed rows.
 *
 * Rendering the stop's items inside a place's frame would assert they are AT
 * that place, which is the one thing the data does not say and the class of
 * error the sourcing standard exists to prevent. A named destination with a
 * number is the whole of what can be claimed truthfully.
 */
function parentHandoff(it) {
  const parent = it.parent;
  if (!parent) return '';
  const shots = store.shotsFor(parent.placeID).length;
  // ITEM 4 · ALL items, for the same reason as Plan's stop chip: this row
  // says what is waiting at the parent stop, not what you have listed.
  const buys = state.shopping.filter((row) => row.placeID === parent.placeID).length;
  const lines = store.summaryLines(parent.item.id).length;
  if (!shots && !buys && !lines) return '';
  const bits = [
    lines ? `${lines} line${lines === 1 ? '' : 's'} on the stop` : '',
    shots ? `${shots} must-see spot${shots === 1 ? '' : 's'}` : '',
    buys ? `${buys} thing${buys === 1 ? '' : 's'} to buy` : '',
  ].filter(Boolean);
  return html`
    <div class="dock-note">
      <button class="linkrow" data-open-parent="${parent.item.id}">
        <div class="linkrow-mark">\u21B0</div>
        <div class="grow">
          <div class="linkrow-t">At ${parent.name}</div>
          <div class="linkrow-s">${bits.join(' \u00B7 ')}</div>
        </div>
        ${raw(icon.chevron)}
      </button>
    </div>`;
}

/**
 * The full card, here, rather than a summary and a screen behind it. A
 * must-see spot is mostly a picture and a sentence about where to stand —
 * summarising that to one line and hiding the rest behind a button removed
 * the only part of it you actually use while standing there.
 */
function shotCards(shots) {
  if (!shots.length) return '';
  return html`
      <div class="col g12 mt10">
        ${shots.map((shot) => html`
          <div class="swipe-row" data-shot-row="${shot.id}" data-shot-name="${shot.title}">
            <div class="swipe-bin">
              <button class="bin" data-swipe-delete aria-label="Delete ${shot.title}">${raw(icon.bin)}</button>
            </div>
            <div class="swipe-face card" style="overflow:hidden;border-radius:16px">
              <div class="shot-img">
                ${shot.imagePath
                  ? html`<img src="${shot.imagePath}" alt="${shot.title}">`
                  : 'example photo'}
                <button class="shot-tick${shot.captured ? ' on' : ''}" data-act="tick-shot" data-id="${shot.id}"
                        role="checkbox" aria-checked="${shot.captured ? 'true' : 'false'}"
                        aria-label="Mark ${shot.title} as taken">
                  ${raw(icon.tick(shot.captured ? '#fff' : '#B4BEB9', 13))}
                </button>
              </div>
              <div style="padding:12px 14px">
                <div class="row g8" style="align-items:baseline">
                  <div class="shot-title grow">${shot.title}</div>
                  <div class="shot-tag">${shot.tag}</div>
                </div>
                ${shot.summary ? html`<div class="shot-desc">${shot.summary}</div>` : ''}
                ${shot.whereToFind ? html`<div class="shot-where">${raw(icon.pin)}${shot.whereToFind}</div>` : ''}
                <button class="btn ghost sm wide mt10" data-edit-shot="${shot.id}">Edit this spot</button>
              </div>
            </div>
          </div>`)}
      </div>`;
}

function shopPanel(it, items) {
  const symbol = state.trip?.currencySymbol || '';
  const spent = items.filter((i) => i.bought)
    .reduce((sum, i) => sum + (i.paidAmount ?? i.estimate ?? 0), 0);
  return html`
    ${items.length ? html`
      <div class="card-list">
        ${items.map((item) => html`
          <div class="swipe-row swipe-flat" data-shop-row="${item.id}" data-shop-name="${item.name}">
            <div class="swipe-bin">
              <button class="bin" data-swipe-delete aria-label="Delete ${item.name}">${raw(icon.bin)}</button>
            </div>
            <div class="swipe-face item">
              <div class="item-top">
                <button class="box${item.bought ? ' on' : ''}" data-act="tick-item" data-id="${item.id}"
                        role="checkbox" aria-checked="${item.bought ? 'true' : 'false'}"
                        aria-label="Mark ${item.name} as bought">
                  ${raw(icon.tick('#fff', 11))}
                </button>
                <button class="grow" style="text-align:left" data-edit-item="${item.id}"
                        aria-label="Correct ${item.name}">
                  <div class="item-name${item.bought ? ' done' : ''}">
                    ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}
                  </div>
                  ${item.detail ? html`<div class="item-sub">${item.detail}</div>` : ''}
                </button>
                <div class="right none">
                  <div class="item-est">${money(item.paidAmount ?? item.estimate ?? 0, symbol)}</div>
                  <div class="item-est-cap">${item.paidAmount != null ? 'paid' : 'est.'}</div>
                </div>
              </div>
              <!-- ITEM 4 · which of the two places this item is, and the one
                   tap that moves it. A bought item is on the list by
                   definition and has nothing to offer here. -->
              ${item.bought ? '' : html`
                <div class="row g8 center mt8" style="padding-left:33px">
                  <div class="grow f11 w650"
                       style="color:${store.isListed(item) ? 'var(--jade)' : 'var(--soft)'}">
                    ${store.isListed(item) ? 'On your shopping list' : 'Noted here only'}
                  </div>
                  <button class="btn ghost sm none" style="width:104px"
                          data-act="${store.isListed(item) ? 'unlist-item' : 'list-item'}"
                          data-id="${item.id}">
                    ${store.isListed(item) ? 'Take off list' : 'Add to list'}
                  </button>
                </div>`}
            </div>
          </div>`)}
      </div>
      <!-- M-9 · p0-2-currency-design.md §7.1: with no currency the money
           clause is OMITTED rather than shown as a bare or yen-prefixed
           number, and the panel says once why the prices have no symbol. Do
           not zero a summary, and do not label one with a currency the trip
           does not have. -->
      <div class="f115 muted mt8">
        ${items.filter((i) => i.bought).length} of ${items.length} bought ·${
          symbol ? html` ${money(spent, symbol)} spent here ·` : ''}
        tap a name to correct it, swipe it left to remove it
      </div>
      ${symbol ? '' : html`
        <div class="f11 w650 lh145 mt6" style="color:var(--amber-fg)">
          Prices have no currency yet. Set it in Trip settings.
        </div>`}
    ` : html`
      <div class="empty">Nothing on your shopping list for this stop.</div>`}

    <button class="btn-dashed mt10" data-act="add-item">+ Something to buy here</button>
    <button class="btn ghost wide mt8" data-act="all-shop">Open the whole shopping list</button>`;
}

/**
 * A place's notes. Newest first, each with the time it was written, and the
 * tab count is notes rather than days — three notes at one market on one
 * afternoon are three rows here, not one.
 */
function logPanel(it, notes) {
  const today = notes.filter((n) => n.dayNumber === state.selectedDay).length;
  return html`
    <div class="row g8 center mb10">
      <div class="grow f115 w700 muted">
        ${notes.length
          ? `${notes.length} note${notes.length === 1 ? '' : 's'} here${today ? ` · ${today} on day ${state.selectedDay}` : ''}`
          : 'No notes here yet'}
      </div>
      <button class="btn sm ink" data-act="note">+ Note</button>
    </div>

    ${notes.length ? html`
      <div class="col g10" id="place-notes">
        ${notes.map((note) => html`
          <div class="swipe-row" data-pnote-row="${note.id}">
            <div class="swipe-bin">
              <button class="bin" data-swipe-delete aria-label="Delete this note">${raw(icon.bin)}</button>
            </div>
            <button class="swipe-face card pad" style="border-radius:16px"
                    data-edit-note="${note.id}" data-note-day="${note.dayNumber}">
              <div class="row between g8" style="align-items:baseline">
                <div class="f12 w800 tnum">${note.time}</div>
                <div class="f11 w650 soft">Day ${note.dayNumber} · ${store.day(note.dayNumber)?.shortDate || ''}</div>
              </div>
              <div class="log-text">${note.text || 'Nothing written yet.'}</div>
              ${note.photoPaths?.length ? html`
                <div class="row g6 wrap mt10">
                  ${note.photoPaths.map((src) => html`
                    <div class="photo-thumb"><img src="${src}" alt=""></div>`)}
                </div>` : ''}
            </button>
          </div>`)}
      </div>
    ` : html`
      <div class="empty">Nothing logged about this place yet.</div>`}

    <div class="f11 soft lh145 mt12">
      Notes belong to this place, so they stay here across days. The Log shows the same ones
      under ${it.name} on the day each was written.
    </div>`;
}

/** Which place the open facts sheet is about: a card's, or this screen's. */
const factsSubject = (it) => store.place(sheet?.id || it?.placeID);

/** Whichever sheet is open, over the panels. */
function sheetMarkup(it, shopHere, shots) {
  if (!sheet) return '';
  const symbol = state.trip?.currencySymbol || '';
  if (sheet.kind === 'item') {
    const item = sheet.id
      ? shopHere.find((i) => i.id === sheet.id)
      : { name: '', detail: '', estimate: null, quantity: 1, placeLabel: it?.name || '' };
    return itemEditor(item, { symbol, error: sheetError });
  }
  if (sheet.kind === 'shot') {
    return shotEditor(sheet.id ? shots.find((sh) => sh.id === sheet.id) : null,
      { placeName: it?.name, error: sheetError, image: pendingPhoto });
  }
  if (sheet.kind === 'facts') {
    // B4 · an id, like the item and shot sheets have carried all along. The
    // Edit chip on a nearby card opens THAT place's sheet without leaving
    // the stop, so correcting a name pasted from a map link no longer means
    // navigating into the place and finding the Info tab first. No id means
    // the subject of this screen, which is what the Info tab's own
    // "Correct or add to this" has always meant.
    return factsEditor(factsSubject(it), { error: sheetError, pending: sheetPending });
  }
  return '';
}
