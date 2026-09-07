// Trip settings. This is deliberately plain: it exists because the currency,
// the dates and the trip's location have to live somewhere, and because the
// app ships with a demo trip you need a way to clear. The designed version of
// this — a trips list and importing an agent itinerary — is still to come.

import { html, raw, icon, delegate, esc } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back, go } from '../nav.js';
import { saveTripFile } from './parts.js';

let notice = '';
/**
 * Which control is doing async work — a key, never a free string (P0-5 R1).
 * `notice` keeps only outcomes and errors (R4): `Trip saved.`, the rate line,
 * the forecast status, the export receipt.
 */
let pending = '';
/**
 * Bug 19 · which stage of the empty-this-trip confirmation is showing:
 * 0 off, 1 the warning that names what goes, 2 the last check. Two gates,
 * because the action destroys the shopping list, the packing list and the
 * Log, and none of that is in any snapshot.
 */
let confirming = 0;
/**
 * B6 · what has been typed into the second gate.
 *
 * The gate is a WORD, not a second button: everything else destructive in
 * this app has a 6-second undo and this one cannot, because the records are
 * gone. It lives here rather than being read off the DOM at click time so a
 * repaint cannot silently re-enable the button, and it is cleared whenever
 * the gate opens or closes so a typed word never outlives its question.
 */
let emptyWord = '';

export default {
  id: 'trip',
  tab: 'map',

  render() {
    const trip = state.trip;
    const offer = store.currencyOffer(trip);
    if (!trip) return html`<section class="screen"><div class="empty">No trip loaded.</div></section>`;

    const weather = store.weatherStatus();
    const counts = {
      stops: state.days.reduce((n, d) => n + store.activeItems(d).length, 0),
      places: state.places.length,
      shopping: state.shopping.length,
      prep: state.prep.length,
      notes: state.log.filter((e) => e.text).length,
    };

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
            <div class="grow">
              <div class="push-title">Trip settings</div>
              <div class="push-sub">${trip.sharedFrom
                ? `${trip.name} · from ${trip.sharedFrom.from || 'the owner'}`
                : trip.name}</div>
            </div>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 32px">

          ${notice ? html`<div class="amber-note f12 mb12">${notice}</div>` : ''}

          <div class="card pad mb12">
            <div class="eyebrow">THE TRIP</div>
            <div class="col g10 mt10">
              ${field('trip-name', 'Name', trip.name)}
              ${field('trip-place', 'City or area', trip.locationName || '',
                trip.currencySettled
                  || trip.locationNotice
                  || 'Used to centre the map and to look up places you add',
                'text', '',
                trip.currencySettled ? 'jade' : Boolean(trip.locationNotice))}
              <div class="row g8">
                ${field('trip-start', 'First day', (trip.startDate || '').slice(0, 10), '', 'date')}
                ${field('trip-days', 'Days', trip.dayCount, '', 'number')}
              </div>
              <div class="f11 soft lh145">
                Changing the dates or the length re-labels the days and keeps what you have
                already planned on the days that still exist.
              </div>
              <button class="btn jade" data-act="save-trip"${
                pending === 'save-trip' ? raw(' disabled aria-busy="true"') : ''}>${
                pending === 'save-trip' ? 'Saving…' : 'Save trip'}</button>
            </div>
          </div>

          <div class="card pad mb12">
            <div class="eyebrow">MONEY</div>
            <div class="col g10 mt10">
              <div class="row g8">
                ${field('cur-symbol', 'Symbol', trip.currencySymbol)}
                ${field('cur-code', 'Spending in', trip.currencyCode || '',
                  trip.currencyCode ? '' : 'not set', 'text', 'e.g. JPY', trip.currencyCode ? false : 'warn')}
                ${field('home-code', 'Your currency', trip.homeCurrencyCode || '',
                  trip.homeCurrencyCode ? '' : 'not set', 'text', 'e.g. MYR', trip.homeCurrencyCode ? false : 'warn')}
              </div>
              <!-- §6.1: where the money came from. A symbol alone is
                   ambiguous — $ is USD, ARS and MXN; ¥ is JPY and CNY — so
                   the line always names the place as well. -->
              <div class="f11 soft lh145">${store.currencyProvenance(trip)}</div>
              ${offer ? html`
                <!-- §6.2: an OFFER, never an overwrite. Money the user typed
                     is theirs; re-deriving over it would be the store making
                     a product decision on their behalf. Dismissed by changing
                     nothing. -->
                <div class="row g8 wrap center">
                  <div class="grow f12 w650 lh145" style="color:var(--amber-fg)">
                    ${offer.city} is in ${offer.country}. Price this trip in ${offer.symbol} ${offer.code}?
                  </div>
                  <button class="btn sm ink none" data-act="use-currency"${
                    pending === 'use-currency' ? raw(' disabled aria-busy="true"') : ''}>${
                    pending === 'use-currency' ? 'Saving…' : html`Use ${offer.symbol} ${offer.code}`}</button>
                </div>` : ''}
              ${field('home-rate', 'Rate', trip.homeCurrencyRate, store.rateLine(), 'number')}
              <div class="row g8">
                <button class="btn ghost grow" data-act="save-money"${
                  pending === 'save-money' ? raw(' disabled aria-busy="true"') : ''}>${
                  pending === 'save-money' ? 'Saving…' : 'Save'}</button>
                <button class="btn ink grow" data-act="refresh-rate"${
                  pending === 'rate' ? raw(' disabled aria-busy="true"') : ''}>${
                  pending === 'rate' ? 'Fetching the rate…' : html`Fetch today's rate`}</button>
              </div>
              <div class="f11 soft lh145">
                ${trip.currencyCode && trip.homeCurrencyCode
                  ? html`Rates come from the European Central Bank's daily publication — free, and it
                         needs no account. Offline, the rate you last saved is used.`
                  : html`A rate needs both codes above — what you are spending, and what you think
                         in. Fill the missing one and the fetch has something to convert between.`}
              </div>
            </div>
          </div>

          <div class="card pad mb12">
            <div class="eyebrow">FORECAST</div>
            <div class="row g8 center mt8">
              <div class="grow f125">${weather.line}</div>
              <button class="btn ghost sm none" data-act="refresh-weather"${
                pending === 'weather' ? raw(' disabled aria-busy="true"') : ''}>${
                pending === 'weather' ? 'Fetching the forecast…' : 'Refresh'}</button>
            </div>
            <div class="f11 soft lh145 mt8">
              Live figures come from Open-Meteo for the trip's location, once the trip is
              within about two weeks. Further out than that, or offline, the strip shows the
              last forecast it managed to fetch.
            </div>
          </div>

          <div class="card pad mb12">
            <div class="eyebrow">WHEN THERE IS NO SIGNAL</div>
            <div class="f125 muted lh145 mt6">
              The trip itself works offline — every screen reads from this phone. Two things
              do not: the map needs to fetch its tiles, so a patch of it can be kept here in
              advance; and a change you make offline waits its turn to reach the cloud, so the
              second button shows anything still waiting.
            </div>
            <div class="row g8 mt10">
              <button class="btn ghost grow" data-act="areas">
                Map kept on this phone${store.mapAreas().length ? ` · ${store.mapAreas().length}` : ''}
              </button>
            </div>
            <!-- B6 · renamed from "Changes on this phone". It is a QUEUE
                 with a count, not a file — and the count is what tells it
                 apart at a glance from the export two cards down. "Save" and
                 "Changes" could be mistaken for each other; "Export" and
                 "Waiting to reach the cloud" cannot. -->
            <div class="row g8 mt8">
              <button class="btn ghost grow" data-act="stuck">
                Waiting to reach the cloud${
                  store.syncState().count ? ` · ${store.syncState().count} change${
                    store.syncState().count === 1 ? '' : 's'}` : ''}
              </button>
            </div>
          </div>

          <div class="card pad mb12">
            <div class="eyebrow">THE ITINERARY</div>
            <div class="f125 muted lh145 mt6">
              The itinerary can arrive all at once. Paste the agent's PDF text or the WhatsApp
              message and confirm the stops it reads — nothing lands until you do.
            </div>
            <button class="btn ghost wide mt10" data-act="paste">Paste an itinerary…</button>
            <button class="btn ghost wide mt8" data-act="export">Export the whole trip as a file…</button>
            <div class="f11 soft lh145 mt7">
              One JSON file holding the whole trip — every stop and where it is, the sub
              routes, the places, the must-see spots, your lists and your Log. Open it back
              on any phone, or keep it as the copy that is not on this one. Photos are left
              out so the file stays small enough to send.
            </div>
            <button class="btn ghost wide mt10" data-act="share">
              ${store.shareState()?.on
    ? `Sharing · ${store.sharePeople().length} ${store.sharePeople().length === 1 ? 'person' : 'people'}`
    : 'Share this trip…'}
            </button>
          </div>

          <div class="card pad">
            <div class="eyebrow" style="color:var(--danger-fg)">START THIS TRIP FRESH</div>
            <!-- The card now explains what the control DOES rather than why
                 it shipped. "The app ships with a demo itinerary" is true of
                 the seed trip and false of every trip the user made, so on a
                 trip with 9 notes and 14 photos the card's own explanation
                 did not describe the button under it. -->
            <div class="f125 muted lh145 mt6">
              Empties this trip and keeps its settings — the dates, the currency and the map
              centre stay. Use it when you are ready to put your own itinerary in, or to clear
              the demo the app ships with.
            </div>
            <div class="row g6 wrap mt10">
              <span class="chip">${counts.stops} stops</span>
              <span class="chip">${counts.places} places</span>
              <span class="chip">${counts.shopping} shopping</span>
              <span class="chip">${counts.prep} packing</span>
              <span class="chip">${counts.notes} notes</span>
            </div>
            ${state.trip?.sharedFrom ? html`
              <!-- Stated before the tap rather than discovered after it. -->
              <div class="f11 soft lh145 mt8">
                This is ${state.trip.sharedFrom.from || 'their'}'s copy. Emptying it does not leave the
                trip — the next update they send will offer everything back.
              </div>` : ''}
            ${confirming === 1 ? html`
              <div class="col g8 mt12">
                <!-- OD-6 answered YES on 5 Sep 2026: this control may delete
                     the private kinds, and the confirm names them, because
                     they are the surprise. Four approved strings promise the
                     Log, the shopping list and the packing list are never in
                     a snapshot and no update can reach them — all four are
                     true, and none of them is about this button. No count is
                     interpolated: the chips above already carry the numbers. -->
                <div class="f125 w650" style="color:var(--danger-fg)">
                  This cannot be undone. Everything listed above goes, including your shopping
                  list, your packing list and your Log.
                </div>
                <div class="row g8">
                  <button class="btn grow" style="background:var(--danger-bg);color:var(--danger-fg)"
                          data-act="clear-confirm">Yes, empty the trip</button>
                  <button class="btn ghost none" style="width:96px" data-act="clear-cancel">Cancel</button>
                </div>
              </div>
            ` : (confirming === 2 ? html`
              <!-- B6 · THE SECOND TAP, TYPED RATHER THAN TAPPED TWICE.
                   Everything else destructive in this app has a 6-second
                   undo. This one cannot: the records are gone. A confirm you
                   can tap twice by reflex is not a second thought — five
                   characters is, and it takes about four seconds.
                   Bug 19's first answer was a differently-shaped pair of
                   buttons, which is better than two identical ones and still
                   a thumb away from destruction.
                   The primary stays rust-on-tint, never a filled rust button
                   — the palette reserves the filled one for the swipe
                   confirm — and it is INERT until the word matches. -->
              <div class="col g8 mt12">
                <div class="f125 w800" style="color:var(--danger-fg)">
                  Empty ${state.trip?.name || 'this trip'}?
                </div>
                <div class="f11 lh145" style="color:var(--danger-fg)">
                  This removes ${counts.stops} stop${counts.stops === 1 ? '' : 's'},
                  ${counts.places} place${counts.places === 1 ? '' : 's'},
                  ${counts.shopping} shopping item${counts.shopping === 1 ? '' : 's'} and
                  ${counts.notes} note${counts.notes === 1 ? '' : 's'} from this phone${
                    state.trip?.sharedFrom ? '' : ' and from everyone you share it with'}.
                  The dates, the currency and the map centre stay.
                </div>
                <div class="f11 w700 lh145" style="color:var(--danger-fg)">
                  There is no undo for this one. Export the trip first if you might want it back.
                </div>
                <label class="f11 soft block" for="empty-word">TYPE EMPTY TO CONFIRM</label>
                <input id="empty-word" value="${esc(emptyWord)}" placeholder="EMPTY"
                       autocapitalize="characters" autocomplete="off" spellcheck="false"
                       aria-label="Type EMPTY to confirm">
                <div class="row g8">
                  <button class="btn grow" style="background:var(--danger-bg);color:var(--danger-fg)"
                          data-act="clear-final"${
                    emptyWord.trim().toUpperCase() === 'EMPTY' ? '' : raw(' disabled')}>Empty it</button>
                  <button class="btn ghost none" style="width:96px" data-act="clear-cancel">Cancel</button>
                </div>
              </div>
            ` : html`
              <!-- Bug 19 · was a neutral ghost. It is the one control on this
                   screen that destroys content, so it wears the destructive
                   colour the palette already reserves for exactly that. -->
              <button class="btn wide mt12" style="background:var(--danger-bg);color:var(--danger-fg)"
                      data-act="clear">Empty this trip…</button>
            `)}
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => { notice = ''; pending = ''; confirming = 0; back(); });
    delegate(root, '[data-act="paste"]', () => go('paste'));
    delegate(root, '[data-act="share"]', () => go('share'));
    delegate(root, '[data-act="export"]', () => {
      saveTripFile();
      notice = 'Saved. Open it again from Paste an itinerary → Choose a trip file.';
      nudge();
    });
    delegate(root, '[data-act="areas"]', () => go('areas'));
    delegate(root, '[data-act="stuck"]', () => go('stuck'));

    delegate(root, '[data-act="save-trip"]', async () => {
      const name = root.querySelector('#trip-name')?.value.trim();
      const place = root.querySelector('#trip-place')?.value.trim();
      const start = root.querySelector('#trip-start')?.value;
      const days = Number(root.querySelector('#trip-days')?.value);

      if (pending) return;
      pending = 'save-trip';
      notice = '';
      nudge();
      await store.updateTrip({
        name: name || state.trip.name,
        locationName: place,
        startDate: start || state.trip.startDate,
        dayCount: Number.isFinite(days) && days > 0 ? days : state.trip.dayCount,
      });
      pending = '';
      notice = 'Trip saved.';
      nudge();
    });

    delegate(root, '[data-act="save-money"]', async () => {
      if (pending) return;
      const rate = Number(root.querySelector('#home-rate')?.value);
      pending = 'save-money';
      notice = '';
      nudge();
      await store.updateTrip({
        currencySymbol: root.querySelector('#cur-symbol')?.value.trim() || state.trip.currencySymbol,
        currencyCode: (root.querySelector('#cur-code')?.value || '').trim().toUpperCase(),
        homeCurrencyCode: (root.querySelector('#home-code')?.value || '').trim().toUpperCase(),
        homeCurrencyRate: rate > 0 ? rate : state.trip.homeCurrencyRate,
        rateSource: '',
      });
      pending = '';
      notice = 'Currency saved.';
      nudge();
    });

    delegate(root, '[data-act="use-currency"]', async () => {
      if (pending) return;
      pending = 'use-currency';
      nudge();
      await store.useOfferedCurrency();
      pending = '';
      notice = 'Currency saved.';
      nudge();
    });

    delegate(root, '[data-act="refresh-rate"]', async () => {
      if (pending) return;
      pending = 'rate';
      notice = '';
      nudge();
      const result = await store.refreshRate();
      // R6 in reverse: the outcome IS the value, so `rateLine()` updating in
      // place is most of the answer; the note carries the rest.
      pending = '';
      notice = result.ok ? `Rate updated: ${store.rateLine()}` : result.reason;
      nudge();
    });

    delegate(root, '[data-act="refresh-weather"]', async () => {
      if (pending) return;
      pending = 'weather';
      notice = '';
      nudge();
      const done = await store.refreshWeather({ force: true });
      pending = '';
      notice = done ? 'Forecast updated.' : store.weatherStatus().line;
      nudge();
    });

    // Bug 19 · `confirming` is a stage now: 0 off, 1 the named warning,
    // 2 the last check. Only stage 2's own control empties anything.
    delegate(root, '[data-act="clear"]', () => { confirming = 1; emptyWord = ''; nudge(); });
    delegate(root, '[data-act="clear-cancel"]', () => { confirming = 0; emptyWord = ''; nudge(); });
    delegate(root, '[data-act="clear-confirm"]', () => { confirming = 2; emptyWord = ''; nudge(); });
    // Commit on input, not on change: the button has to come alive as the
    // fifth character lands, not when the field is left.
    root.querySelector('#empty-word')?.addEventListener('input', (event) => {
      emptyWord = event.target.value;
      nudge();
      const el = root.querySelector('#empty-word');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
    delegate(root, '[data-act="clear-final"]', () => {
      // Belt to the disabled attribute's braces. A repaint, a stale node or
      // a synthetic click must not be able to empty a trip on a word that
      // does not match.
      if (emptyWord.trim().toUpperCase() !== 'EMPTY') return;
      store.clearTripContent();
      confirming = 0;
      emptyWord = '';
      notice = 'The trip is empty. Add your first stop from Plan → Edit.';
      nudge();
    });
  },
};

function nudge() {
  store.selectDay(state.selectedDay);
}

/**
 * Bug 17 — why "Fetch today's rate" looked broken and was not.
 *
 * `fetchRate` returns null unless BOTH currency codes are set, and the amber
 * strip said so correctly. What misled was the field: its placeholder was a
 * bare `MYR`, and in a three-letter uppercase slot a placeholder is
 * indistinguishable from a set value — so an empty field looked filled and a
 * correct refusal looked like a failure. The placeholders can no longer be
 * read as values, and an unset code now says so under the field it is about
 * rather than only in a strip at the top of the screen.
 *
 * `warn` takes four values: false (the standing soft hint), 'warn' (amber —
 * needs attention, not an error), true (rust — something the user asked for
 * did not happen) and 'jade' (settled — it happened, and this is what it
 * did). p0-2-currency-design.md §6.2 needs the last for the city field the
 * moment a re-geocode adopts a currency.
 */
function field(id, label, value, hint = '', type = 'text', placeholder = '', warn = false) {
  const tone = warn === 'jade'
    ? ';color:var(--jade)'
    // Bug 17 · an unset field is not an error, so it takes amber's "needs
    // attention" rather than rust's "something went wrong".
    : (warn === 'warn' ? ';color:var(--amber-fg)'
      : (warn ? ';color:var(--danger-fg)' : ''));
  // M-12 · three of these sit in one `.row.g8` at 390px, where `YOUR
  // CURRENCY` is just too wide and wraps to two lines — which pushed its own
  // input 19px below the other two (measured y = 507 · 507 · 526) and made
  // the row read as two rows. A column with the input pushed to the bottom
  // aligns the three inputs whatever their labels do, without shortening a
  // label or narrowing a field.
  return html`
    <label class="grow" style="display:flex;flex-direction:column">
      <span class="f11 w800 soft" style="letter-spacing:.06em;text-transform:uppercase">${label}</span>
      <input id="${id}" type="${type}" value="${value ?? ''}" placeholder="${placeholder}"
             class="mt4" style="width:100%;margin-top:auto">
      ${hint ? html`<span class="f11${warn ? '' : ' soft'} lh145" style="display:block;margin-top:3px${tone}">${hint}</span>` : ''}
    </label>`;
}
