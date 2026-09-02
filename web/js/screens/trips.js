// The home screen: every trip as a card, and a form to start a new one. The
// five tabs are out of reach until a trip is chosen, because none of them mean
// anything without one. Styling here is deliberately plain — the designed
// version of this screen is still to come.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { swipeToDelete } from './parts.js';

let addOpen = false;
let busy = '';

export default {
  id: 'trips',
  tab: null,

  render() {
    const trips = state.trips;

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row">
            <div class="grow">
              <div class="screen-title">My trips</div>
              <div class="screen-sub">
                ${trips.length ? `${trips.length} trip${trips.length === 1 ? '' : 's'}` : 'Nothing planned yet'}
              </div>
            </div>
            <button class="btn sm ink" data-act="add-toggle">${addOpen ? 'Close' : '+ New trip'}</button>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 32px">
          ${busy ? html`<div class="amber-note f12 mb12">${busy}</div>` : ''}
          ${addOpen ? addForm() : ''}

          ${trips.length ? trips.map((trip) => card(trip)) : html`
            <div class="empty">
              No trips yet.<br>
              Press <b>+ New trip</b> and give it a name and dates.
            </div>`}

          <div class="f11 soft lh145 mt14">
            Swipe a trip left to delete it. Deleting a trip removes its itinerary, places,
            shopping list, packing list and notes.
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="add-toggle"]', () => { addOpen = !addOpen; store.refreshTrips(); });
    delegate(root, '[data-act="add-cancel"]', () => { addOpen = false; store.refreshTrips(); });

    delegate(root, '[data-act="add-save"]', async () => {
      const name = root.querySelector('#new-trip-name')?.value.trim();
      if (!name) return;
      busy = `Creating ${name}…`;
      addOpen = false;
      store.refreshTrips();

      await store.createTrip({
        name,
        startDate: root.querySelector('#new-trip-start')?.value || null,
        dayCount: root.querySelector('#new-trip-days')?.value,
        locationName: root.querySelector('#new-trip-place')?.value.trim(),
      });
      busy = '';
      go('plan');
    });

    delegate(root, '[data-open-trip]', async (el) => {
      busy = 'Opening…';
      store.refreshTrips();
      await store.switchTrip(el.dataset.openTrip);
      busy = '';
      go('map');
    });

    swipeToDelete(root, {
      rowSelector: '[data-trip-row]',
      label: (row) => `Delete "${row.dataset.tripName}" and everything in it?`,
      onDelete: async (row) => {
        busy = 'Deleting…';
        store.refreshTrips();
        await store.deleteTrip(row.dataset.tripRow);
        busy = '';
      },
    });
  },
};

function card(trip) {
  const active = trip.id === state.tripID;
  const span = tripDates(trip);
  return html`
    <div class="swipe-row mb10" data-trip-row="${trip.id}" data-trip-name="${trip.name}">
      <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete trip">${raw(icon.bin)}</button></div>
      <button class="swipe-face trip-card${active ? ' on' : ''}" data-open-trip="${trip.id}">
        <div class="trip-card-mark">${trip.code || '··'}</div>
        <div class="grow">
          <div class="trip-card-name">${trip.name}</div>
          <div class="trip-card-meta">${span}</div>
        </div>
        ${active ? html`<span class="chip jade">OPEN</span>` : raw(icon.chevron)}
      </button>
    </div>`;
}

/** "14–18 Sep 2026 · 5 days", or just the length when there are no dates. */
function tripDates(trip) {
  const days = `${trip.dayCount} day${trip.dayCount === 1 ? '' : 's'}`;
  if (!trip.startDate) return `${days} · no dates set`;
  const start = new Date(trip.startDate);
  if (Number.isNaN(start.getTime())) return days;
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, trip.dayCount - 1));
  const fmt = (d, withYear) => d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}),
  });
  return `${fmt(start, false)} – ${fmt(end, true)} · ${days}`;
}

function addForm() {
  return html`
    <div class="form mb14">
      <div class="form-title">New trip</div>
      <input id="new-trip-name" placeholder="Where are you going?">
      <input id="new-trip-place" placeholder="City or area (centres the map)">
      <div class="row g8">
        <input id="new-trip-start" type="date" class="grow">
        <input id="new-trip-days" type="number" value="5" min="1" max="60" style="width:88px" aria-label="Days">
      </div>
      <div class="form-actions">
        <button class="btn jade grow" data-act="add-save">Create</button>
        <button class="btn ghost" style="width:96px" data-act="add-cancel">Cancel</button>
      </div>
      <div class="form-hint">
        It starts empty. Add the itinerary from Plan → the pencil, one stop at a time.
      </div>
    </div>`;
}
