// Trip settings. This is deliberately plain: it exists because the currency,
// the dates and the trip's location have to live somewhere, and because the
// app ships with a demo trip you need a way to clear. The designed version of
// this — a trips list and importing an agent itinerary — is still to come.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back } from '../nav.js';

let notice = '';
let confirming = false;

export default {
  id: 'trip',
  tab: 'map',

  render() {
    const trip = state.trip;
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
              <div class="push-sub">${trip.name}</div>
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
                'Used to centre the map and to look up places you add')}
              <div class="row g8">
                ${field('trip-start', 'First day', (trip.startDate || '').slice(0, 10), '', 'date')}
                ${field('trip-days', 'Days', trip.dayCount, '', 'number')}
              </div>
              <div class="f11 soft lh145">
                Changing the dates or the length re-labels the days and keeps what you have
                already planned on the days that still exist.
              </div>
              <button class="btn jade" data-act="save-trip">Save trip</button>
            </div>
          </div>

          <div class="card pad mb12">
            <div class="eyebrow">MONEY</div>
            <div class="col g10 mt10">
              <div class="row g8">
                ${field('cur-symbol', 'Symbol', trip.currencySymbol)}
                ${field('cur-code', 'Spending in', trip.currencyCode || '', '', 'text', 'JPY')}
                ${field('home-code', 'Your currency', trip.homeCurrencyCode || '', '', 'text', 'MYR')}
              </div>
              ${field('home-rate', 'Rate', trip.homeCurrencyRate, store.rateLine(), 'number')}
              <div class="row g8">
                <button class="btn ghost grow" data-act="save-money">Save</button>
                <button class="btn ink grow" data-act="refresh-rate">Fetch today's rate</button>
              </div>
              <div class="f11 soft lh145">
                Rates come from the European Central Bank's daily publication — free, and it
                needs no account. Offline, the rate you last saved is used.
              </div>
            </div>
          </div>

          <div class="card pad mb12">
            <div class="eyebrow">FORECAST</div>
            <div class="row g8 center mt8">
              <div class="grow f125">${weather.line}</div>
              <button class="btn ghost sm none" data-act="refresh-weather">Refresh</button>
            </div>
            <div class="f11 soft lh145 mt8">
              Live figures come from Open-Meteo for the trip's location, once the trip is
              within about two weeks. Further out than that, or offline, the strip shows the
              last forecast it managed to fetch.
            </div>
          </div>

          <div class="card pad">
            <div class="eyebrow" style="color:var(--danger-fg)">START THIS TRIP FRESH</div>
            <div class="f125 muted lh145 mt6">
              The app ships with a demo itinerary so the screens have something in them. This
              empties the trip and keeps its settings — use it once you are ready to put your
              own itinerary in.
            </div>
            <div class="row g6 wrap mt10">
              <span class="chip">${counts.stops} stops</span>
              <span class="chip">${counts.places} places</span>
              <span class="chip">${counts.shopping} shopping</span>
              <span class="chip">${counts.prep} packing</span>
              <span class="chip">${counts.notes} notes</span>
            </div>
            ${confirming ? html`
              <div class="col g8 mt12">
                <div class="f125 w650" style="color:var(--danger-fg)">
                  This cannot be undone. Everything listed above will be deleted.
                </div>
                <div class="row g8">
                  <button class="btn grow" style="background:var(--danger-bg);color:var(--danger-fg)"
                          data-act="clear-confirm">Yes, empty the trip</button>
                  <button class="btn ghost none" style="width:96px" data-act="clear-cancel">Cancel</button>
                </div>
              </div>
            ` : html`
              <button class="btn ghost mt12" data-act="clear">Empty this trip…</button>
            `}
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => { notice = ''; confirming = false; back(); });

    delegate(root, '[data-act="save-trip"]', async () => {
      const name = root.querySelector('#trip-name')?.value.trim();
      const place = root.querySelector('#trip-place')?.value.trim();
      const start = root.querySelector('#trip-start')?.value;
      const days = Number(root.querySelector('#trip-days')?.value);

      notice = 'Saving…';
      nudge();
      await store.updateTrip({
        name: name || state.trip.name,
        locationName: place,
        startDate: start || state.trip.startDate,
        dayCount: Number.isFinite(days) && days > 0 ? days : state.trip.dayCount,
      });
      notice = 'Trip saved.';
      nudge();
    });

    delegate(root, '[data-act="save-money"]', async () => {
      const rate = Number(root.querySelector('#home-rate')?.value);
      await store.updateTrip({
        currencySymbol: root.querySelector('#cur-symbol')?.value.trim() || state.trip.currencySymbol,
        currencyCode: (root.querySelector('#cur-code')?.value || '').trim().toUpperCase(),
        homeCurrencyCode: (root.querySelector('#home-code')?.value || '').trim().toUpperCase(),
        homeCurrencyRate: rate > 0 ? rate : state.trip.homeCurrencyRate,
        rateSource: '',
      });
      notice = 'Currency saved.';
      nudge();
    });

    delegate(root, '[data-act="refresh-rate"]', async () => {
      notice = 'Fetching the rate…';
      nudge();
      const result = await store.refreshRate();
      notice = result.ok ? `Rate updated: ${store.rateLine()}` : result.reason;
      nudge();
    });

    delegate(root, '[data-act="refresh-weather"]', async () => {
      notice = 'Fetching the forecast…';
      nudge();
      const done = await store.refreshWeather({ force: true });
      notice = done ? 'Forecast updated.' : store.weatherStatus().line;
      nudge();
    });

    delegate(root, '[data-act="clear"]', () => { confirming = true; nudge(); });
    delegate(root, '[data-act="clear-cancel"]', () => { confirming = false; nudge(); });
    delegate(root, '[data-act="clear-confirm"]', () => {
      store.clearTripContent();
      confirming = false;
      notice = 'The trip is empty. Add your first stop from Plan → Edit.';
    });
  },
};

function nudge() {
  store.selectDay(state.selectedDay);
}

function field(id, label, value, hint = '', type = 'text', placeholder = '') {
  return html`
    <label class="grow" style="display:block">
      <span class="f11 w800 soft" style="letter-spacing:.06em;text-transform:uppercase">${label}</span>
      <input id="${id}" type="${type}" value="${value ?? ''}" placeholder="${placeholder}"
             class="mt4" style="width:100%">
      ${hint ? html`<span class="f11 soft" style="display:block;margin-top:3px">${hint}</span>` : ''}
    </label>`;
}
