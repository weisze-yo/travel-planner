// The trips home — a status board, not a list.
//
// A trip is either running, coming up or finished, and each of those wants a
// different card: the running one shows what is next, the upcoming one shows
// how ready you are, the finished one shows what it came to.
//
// The cover comes from a photo already in the trip's log, or from the phone.
// The app cannot invent one, so the fallback is a plain tinted field with the
// trip's mark — never a stock photo of somewhere you have not been.

import { html, raw, icon, delegate, money } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { swipeToDelete, signInPanel, mountSignIn } from './parts.js';
import { prepare } from '../photos.js';
import { initialFor } from '../share.js';

let addOpen = false;
let signingIn = false;
let busy = '';
/**
 * Which control is doing async work — a key, never a free string (P0-5 §8.1).
 * Pending belongs to the control that started the work (R1), so the screen has
 * to know *which* control, not merely that something is happening. `busy`
 * keeps its own job and only its own job: outcomes, refusals and payloads (R4).
 */
let pending = '';
/**
 * The New-trip modal's one required field, when it has refused. A form that
 * refuses says which field, in that field, in rust, and leaves the button
 * alone (`p1-destination-tabs-design.md` §6.2). Not an `.amber-note`: the note
 * slot is for outcomes, and a missing name is not an outcome.
 */
let nameError = '';
/**
 * What the city field's lookup has answered, as one of the six states in
 * p0-2-currency-design.md §4. Null until the field commits. It is a
 * disclosure, never a gate: Create is enabled in every one of the six.
 */
let guess = null;
/** The trip whose cover is being chosen, if any. */
let covering = null;

export default {
  id: 'trips',
  tab: null,
  /** The five tabs belong to a trip; this screen is above all of them. */
  chrome: false,

  render() {
    if (covering) return coverSheet();

    const groups = store.tripGroups();
    const total = state.trips.length;
    // R11: while one trip is opening, the other cards go non-interactive —
    // two navigations cannot both win — but they do not fade, so it stays
    // obvious which tap the app is answering.
    const opening = pending.startsWith('open:') ? pending.slice(5) : '';

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row">
            <div class="grow">
              <div class="screen-title">My trips</div>
              <div class="screen-sub">
                ${total ? `${total} trip${total === 1 ? '' : 's'}` : 'Nothing planned yet'}
                ${groups.running.length ? ` · ${groups.running.length} on now` : ''}
              </div>
            </div>
            <button class="btn sm ink" data-act="add-toggle"${addOpen ? ' disabled' : ''}>+ New trip</button>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 32px">
          ${busy ? html`<div class="amber-note f12 mb12">${busy}</div>` : ''}

          ${accountRow()}

          ${removedCard()}

          ${groups.running.length ? html`
            <div class="eyebrow">ON NOW</div>
            ${groups.running.map((trip) => runningCard(trip, opening))}` : ''}

          ${groups.upcoming.length ? html`
            <div class="eyebrow${groups.running.length ? ' mt14' : ''}">COMING UP</div>
            ${groups.upcoming.map((trip) => plainCard(trip, 'upcoming', opening))}` : ''}

          ${groups.finished.length ? html`
            <div class="eyebrow mt14">FINISHED</div>
            ${groups.finished.map((trip) => plainCard(trip, 'finished', opening))}` : ''}

          ${total ? html`
            <div class="f11 soft lh145 mt14">
              Swipe a trip left to delete it. A finished trip stays until you do.
            </div>` : html`
            <div class="empty-t1 mt8">
              <div class="empty-t1-mark"></div>
              <div class="empty-t1-title">No trips yet</div>
              <div class="empty-t1-body">
                A trip needs a name and dates to start. Everything else — the itinerary, the
                lists, the map — follows once it exists.
              </div>
              <div class="col g8 mt14" style="width:100%">
                <button class="btn ink" data-act="add-toggle">+ New trip</button>
              </div>
              <div class="empty-t1-hint">
                A trip somebody shares with you arrives by opening their link.
              </div>
            </div>`}
        </div>

        ${addOpen ? html`
          <!-- Inert on purpose: Create and Cancel are the only ways out. -->
          <div class="scrim"></div>
          <div class="modal">${addForm()}</div>` : ''}

        ${signingIn ? html`
          <div class="scrim" data-act="sign-close"></div>
          <div class="modal">
            <div class="form" style="padding:18px 16px 16px">
              ${signInPanel({
                title: 'Sign in',
                sub: 'So this stops being one phone’s trip. Every trip you have made comes with '
                  + 'you, under the same name and the same links. The sample trip does not — '
                  + 'it stays here, for whenever nobody is signed in.',
              })}
              <button class="btn ghost mt12" style="width:100%" data-act="sign-close">Not now</button>
            </div>
          </div>` : ''}
      </section>`;
  },

  mount(root) {
    if (covering) return mountCover(root);

    delegate(root, '[data-act="keep-side"]', () => {
      store.keepMySide();
      store.refreshTrips();
    });
    delegate(root, '[data-act="message-owner"]', async (el) => {
      const text = `About ${el.dataset.trip || 'the trip'} — could we talk about it?`;
      try {
        await navigator.clipboard.writeText(text);
        busy = 'Message copied.';
      } catch {
        busy = text;
      }
      store.refreshTrips();
    });

    delegate(root, '[data-act="sign-open"]', () => { signingIn = true; store.refreshTrips(); });
    delegate(root, '[data-act="sign-close"]', () => {
      signingIn = false;
      store.noteSignIn('');
    });
    mountSignIn(root, { onDone: () => { signingIn = false; } });

    delegate(root, '[data-act="sign-out"]', async () => {
      pending = 'signout';
      store.refreshTrips();
      await store.signOut();
      pending = '';
      store.refreshTrips();
    });

    delegate(root, '[data-act="add-toggle"]', () => {
      addOpen = !addOpen; nameError = ''; guess = null; store.refreshTrips();
    });
    delegate(root, '[data-act="add-cancel"]', () => {
      if (pending) return;
      addOpen = false; nameError = ''; guess = null; store.refreshTrips();
    });

    delegate(root, '[data-act="add-save"]', async () => {
      if (pending) return;
      const name = root.querySelector('#new-trip-name')?.value.trim();
      // A form that can refuse says so in the field, in rust — it does not
      // pre-disable its primary and it does not return in silence (rule 3).
      if (!name) {
        nameError = 'A name for the trip — anything you will recognise.';
        store.refreshTrips();
        root.querySelector('#new-trip-name')?.focus();
        return;
      }
      nameError = '';
      // R8: Create is one of the three flows whose surface IS the work, so
      // the modal stays up until it resolves. It used to close on the first
      // line and drop `Creating…` at the top of a screen the user had just
      // left, which is the furthest a message gets from the button pressed.
      pending = 'create';
      store.refreshTrips();
      await makeTrip(root, name, 'paste');
    });

    // OD-9. The same create, landing on the trip instead of on Paste.
    delegate(root, '[data-act="add-save-later"]', async () => {
      if (pending) return;
      const name = root.querySelector('#new-trip-name')?.value.trim();
      if (!name) {
        nameError = 'A name for the trip — anything you will recognise.';
        store.refreshTrips();
        root.querySelector('#new-trip-name')?.focus();
        return;
      }
      nameError = '';
      pending = 'create';
      store.refreshTrips();
      await makeTrip(root, name, 'map');
    });

    // The lookup is fired by the city field's `change` — the app's universal
    // commit event — not by Create, so the answer is on screen BEFORE the
    // decision, on the screen where the mistake was made (§2.2). It never
    // gates Create: every one of the six states leaves the button enabled.
    root.querySelector('#new-trip-place')?.addEventListener('change', async (event) => {
      const city = event.target.value.trim();
      if (!city) { guess = null; store.refreshTrips(); return; }
      guess = { state: 'looking', city };
      store.refreshTrips();
      const answer = await store.previewCurrency(city);
      // The field may have moved on while this was in flight; a stale answer
      // must not overwrite a newer question.
      if (root.querySelector('#new-trip-place')?.value.trim() === city) {
        guess = answer;
        store.refreshTrips();
      }
    });

    delegate(root, '[data-open-trip]', async (el) => {
      if (pending) return;
      pending = `open:${el.dataset.openTrip}`;
      store.refreshTrips();
      await store.switchTrip(el.dataset.openTrip);
      pending = '';
      go('map');
    });
    delegate(root, '[data-cover]', (el) => {
      covering = el.dataset.cover;
      store.refreshTrips();
    });

    swipeToDelete(root, {
      rowSelector: '[data-trip-row]',
      name: (row) => row.dataset.tripName,
      label: () => 'Its itinerary, places, lists and notes go with it',
      onDelete: async (row) => {
        // The label swap lives on the confirm's own button (parts.js
        // swipeToDelete), so nothing is written to the screen-level slot.
        await store.deleteTrip(row.dataset.tripRow);
      },
    });
  },
};

/**
 * Who this phone is, above the trips. Signed in it is one quiet line — the
 * name, the address it is under, and the way out. Signed out it is the only
 * place in the app that offers a sign-in without an invite link, and it says
 * what signing in buys rather than demanding it: nothing below this row needs
 * an account to work.
 */
function accountRow() {
  const who = store.account();
  if (!who) {
    return html`
      <div class="acct">
        <div class="grow">
          <div class="acct-name">Everything is on this phone</div>
          <div class="acct-sub">
            Sign in and your trips follow you to a new one — and a shared link can reach it.
          </div>
        </div>
        <button class="btn sm ink" data-act="sign-open">Sign in</button>
      </div>`;
  }
  // N-7 · G-1's whole fix: one substituted sub-line on a row that is already
  // rendering. No banner, no overlay, no strip — the account row is where the
  // account speaks, and the app's one arrival banner belongs to joining a
  // trip. No dismiss control either: it is not a message, it is the row
  // telling the truth about a change that just happened, and the next paint
  // replaces it.
  const arrived = store.takeArrivalNotice();
  return html`
    <div class="acct">
      <span class="who-mark">${initialFor(store.me().name)}</span>
      <div class="grow">
        <div class="acct-name">${store.me().name}</div>
        <div class="acct-sub">${arrived
          || who.email
          || (who.provider === 'google' ? 'Google account' : 'Signed in')}</div>
      </div>
      <button class="btn sm ghost" data-act="sign-out"${
        pending === 'signout' ? raw(' disabled aria-busy="true"') : ''}>${
        pending === 'signout' ? 'Signing out…' : 'Sign out'}</button>
    </div>`;
}

/**
 * Create, from either control. §5: Create is never gated on the currency and
 * the modal stays up until `createTrip` resolves, rather than being torn down
 * over a wait that has an outcome.
 *
 * When the lookup raced Create and lost, the failure is carried to the screen
 * the app actually moves to. Today all three failure strings were written to
 * a screen nobody is ever sent to, so a wrong city was silent.
 */
async function makeTrip(root, name, land) {
  const place = root.querySelector('#new-trip-place')?.value.trim();
  await store.createTrip({
    name,
    startDate: root.querySelector('#new-trip-start')?.value || null,
    dayCount: root.querySelector('#new-trip-days')?.value,
    locationName: place,
  });
  const raced = place && !state.trip?.currencyCode && guess?.state !== 'notfound'
    && guess?.state !== 'nocurrency' && guess?.state !== 'offline'
    ? `${place} was not found, so this trip has no map centre and no currency. `
      + 'Both are on Trip settings.'
    : '';
  pending = '';
  addOpen = false;
  guess = null;
  nameError = '';
  if (raced) store.noteArrival(raced);
  go(land);
}

// -------------------------------------------------------------- the cards

/**
 * P0-5 §4 and R11. The card being opened carries the visual state — the app
 * is answering that tap and no other — at the existing `.btn[disabled]`
 * values, since a card is not a `<button>` and cannot take the attribute. Its
 * siblings only stop responding: `pointer-events` alone, no fade, so the
 * screen does not grey out around the one card that matters.
 */
function cardBusy(opening, id) {
  if (!opening) return '';
  return opening === id
    ? raw(' style="opacity:.45;pointer-events:none" aria-busy="true"')
    : raw(' style="pointer-events:none"');
}

/** The running trip gets the width of a cover and the next thing on the day. */
function runningCard(trip, opening = '') {
  const mine = opening === trip.id;
  const card = store.runningCard(trip);
  const n = card?.dayNumber ?? store.tripCurrentDay(trip);
  const symbol = trip.currencySymbol || '';

  return html`
    <div class="swipe-row mt8" data-trip-row="${trip.id}" data-trip-name="${trip.name}">
      <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete trip">${raw(icon.bin)}</button></div>
      <div class="swipe-face trip-running"${cardBusy(opening, trip.id)}>
        <div class="trip-cover" style="${coverStyle(trip)}">
          <button class="trip-cover-hit" data-open-trip="${trip.id}" aria-label="Open ${trip.name}"></button>
          <div class="trip-cover-wash"></div>
          ${!trip.coverPhoto ? html`
            <span class="trip-cover-mark" style="color:${store.coverTint(trip).fg}">${trip.code || '··'}</span>` : ''}
          <span class="trip-cover-day">DAY ${n} OF ${trip.dayCount}</span>
          <button class="trip-cover-edit" data-cover="${trip.id}"
                  aria-label="Choose a cover for ${trip.name}">Cover</button>
          <div class="trip-cover-text">
            <div class="trip-cover-name">${trip.name}</div>
            <div class="trip-cover-meta">
              ${tripDates(trip)}${card ? ` · ${card.stops} stop${card.stops === 1 ? '' : 's'} today` : ''}
            </div>
          </div>
        </div>

        ${card?.next ? html`
          <button class="trip-next" data-open-trip="${trip.id}">
            <div class="none f125 w700 tnum" style="width:38px">${card.next.time}</div>
            <div class="grow">
              <div class="f135 w650" style="line-height:1.25">${card.next.name}</div>
              <div class="f11 muted mt2">Next stop · ${card.next.after}</div>
            </div>
            ${card.next.away ? html`<span class="chip jade none">${card.next.away}</span>` : ''}
          </button>` : ''}

        <button class="trip-foot" data-open-trip="${trip.id}">
          ${mine ? html`
            <div class="grow"><span class="chip amber none">Opening…</span></div>` : html`
            <div class="grow f115 w650 muted">
              ${card
                ? (symbol
                  ? `${card.buying} to buy today · ${money(card.spent, symbol)} spent so far`
                  : `${card.buying} to buy today`)
                : 'Open it to see today'}
            </div>
            <div class="f12 w700" style="color:var(--jade)">Open ›</div>`}
        </button>
      </div>
    </div>`;
}

/** Coming up and finished share a shape; what they say differs. */
/**
 * Opening a trip you have been removed from. Under the shared-plan model the
 * loss is much smaller than it looks, and the screen says so: the schedule
 * goes, but the shopping list, the Log and the packing list were always
 * theirs and stay. Left unsaid, they assume the worst.
 */
function removedCard() {
  const gone = store.removal();
  if (!gone) return '';
  return html`
    <div class="eyebrow rust mb8">No longer shared with you</div>
    <div class="gone-card">
      <div class="gone-t">${state.trip?.name || 'That trip'}</div>
      <div class="gone-s">
        ${gone.by} removed you on ${store.stamp(gone.on || gone.at)}. The schedule and the
        places have gone from this phone — you’ll no longer see changes to them.
      </div>
    </div>

    <div class="eyebrow mb8">Still yours, untouched</div>
    <div class="card mb14" style="padding:12px 13px">
      ${store.keptAfterRemoval().map((kept) => html`
        <div class="kept-line">
          <span class="dot" style="margin-top:6px"></span>
          <span class="grow">${kept.line}</span>
        </div>`)}
    </div>

    <div class="row g8 mb8">
      <button class="btn jade grow" data-act="keep-side">Keep my side as its own trip</button>
      <button class="btn ghost none" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;padding:0 12px"
              data-act="message-owner"
              data-trip="${state.trip?.name || ''}">Message ${String(gone.by).split(' ')[0]}</button>
    </div>
    <div class="f11 soft lh145 mb18">
      Keeping it makes a trip only you can see, with the dates, your lists and your Log.
      The stops don’t come with it.
    </div>`;
}

function plainCard(trip, kind, opening = '') {
  const mine = opening === trip.id;
  const gap = store.tripDayGap(trip);
  const ready = kind === 'upcoming' ? store.tripReadiness(trip) : null;
  const recap = kind === 'finished' ? store.tripRecap(trip) : null;
  const tint = store.coverTint(trip);
  const symbol = trip.currencySymbol || '';

  return html`
    <div class="swipe-row mt8" data-trip-row="${trip.id}" data-trip-name="${trip.name}">
      <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete trip">${raw(icon.bin)}</button></div>
      <div class="swipe-face trip-plain${kind === 'finished' ? ' done' : ''}"${cardBusy(opening, trip.id)}>
        <div class="row g12" style="align-items:flex-start">
          <button class="trip-mark-lg" data-cover="${trip.id}"
                  aria-label="Choose a cover for ${trip.name}"
                  style="${trip.coverPhoto
                    ? `background-image:url(${trip.coverPhoto});background-size:cover;background-position:center`
                    : `background:${tint.bg};color:${tint.fg}`}">
            ${trip.coverPhoto ? '' : (trip.code || '··')}
          </button>
          <button class="grow" style="text-align:left" data-open-trip="${trip.id}">
            <div class="trip-card-name">${trip.name}</div>
            <div class="trip-card-meta">${tripDates(trip)}</div>
          </button>
          ${kind === 'upcoming'
            ? html`<span class="chip ${gap != null && gap <= 14 ? 'amber' : ''} none">
                     ${gap == null ? 'NO DATES' : (gap === 0 ? 'TOMORROW' : `IN ${gap} DAYS`)}
                   </span>`
            : html`<button class="f12 w700 none" style="color:var(--jade);padding-top:2px"
                           data-open-trip="${trip.id}">Open ›</button>`}
        </div>

        ${mine ? html`
          <div class="row g6 wrap mt11"><span class="chip amber none">Opening…</span></div>` : ''}

        ${!mine && ready ? html`
          <div class="row g6 wrap mt11">
            <span class="chip ${ready.emptyDays ? 'amber' : 'jade'}">
              ${ready.emptyDays ? `${ready.emptyDays} empty day${ready.emptyDays === 1 ? '' : 's'}` : 'every day planned'}
            </span>
            <span class="chip ${ready.prep && ready.packed === ready.prep ? 'jade' : ''}">
              ${ready.prep ? `${ready.packed} of ${ready.prep} packed` : 'nothing on the packing list'}
            </span>
            ${ready.planned && symbol ? html`<span class="chip">${money(ready.planned, symbol)} planned</span>` : ''}
          </div>` : ''}

        ${!mine && recap ? html`
          <div class="row g6 wrap mt11">
            <span class="chip">${recap.stops} stops</span>
            ${symbol ? html`<span class="chip">${money(recap.spent, symbol)} spent</span>` : ''}
            <span class="chip">${recap.notes} note${recap.notes === 1 ? '' : 's'}</span>
          </div>` : ''}

        ${!mine && !ready && !recap ? html`
          <div class="f11 soft mt8">Open it to see how ready it is.</div>` : ''}
      </div>
    </div>`;
}

function coverStyle(trip) {
  if (trip.coverPhoto) {
    return `background-image:url(${trip.coverPhoto});background-size:cover;background-position:center`;
  }
  return `background:${store.coverTint(trip).bg}`;
}

// -------------------------------------------------------- choosing a cover

/**
 * Where a cover comes from: a photo already attached to a note, or one off
 * the phone, or a plain tinted field. No image service is involved and
 * nothing is uploaded to pick it — the photos offered are the ones already
 * in this trip.
 */
function coverSheet() {
  const trip = state.trips.find((t) => t.id === covering);
  const isOpen = covering === state.tripID;
  const photos = isOpen ? store.coverCandidates() : [];

  return html`
    <section class="screen">
      <div class="head">
        <div class="head-row center">
          <button class="iconbtn" data-act="cover-close" aria-label="Back">${raw(icon.close)}</button>
          <div class="grow">
            <div class="push-title">Cover for ${trip?.name || 'this trip'}</div>
            <div class="push-sub">Kept on this phone at thumbnail size, so it still shows with no signal.</div>
          </div>
        </div>
      </div>

      <div class="scroll" style="padding:14px 16px 24px">
        ${busy ? html`<div class="amber-note f12 mb12">${busy}</div>` : ''}

        <div class="eyebrow">FROM THIS TRIP'S LOG</div>
        ${photos.length ? html`
          <div class="row g8 mt8">
            ${photos.slice(0, 4).map((p) => html`
              <button class="cover-pick${trip?.coverPhoto === p.src ? ' on' : ''}"
                      data-pick-photo="${p.src}" aria-label="Use this photo">
                <img src="${p.src}" alt="">
                ${trip?.coverPhoto === p.src ? html`<span class="cover-tick">✓</span>` : ''}
              </button>`)}
          </div>
          <div class="f11 soft lh145 mt7">
            Only photos already attached to a note. Nothing is uploaded to pick this.
          </div>
        ` : html`
          <div class="empty" style="padding:14px">
            ${isOpen
              ? 'No photos in this trip\'s log yet. Attach one to a note and it can be the cover.'
              : 'Open this trip to pick from its photos.'}
          </div>`}

        <div class="eyebrow mt18">OR A PLAIN FIELD</div>
        <div class="row g8 mt8">
          ${store.COVER_TINTS.map((t) => html`
            <button class="cover-tint${(trip?.coverTint || 'jade') === t.id && !trip?.coverPhoto ? ' on' : ''}"
                    data-pick-tint="${t.id}" style="background:${t.bg};color:${t.fg}"
                    aria-label="Plain ${t.id}">${trip?.code || '··'}</button>`)}
        </div>

        <!-- A file label is not a <button>, so [disabled] does nothing to
             it; P0-5 §4 says apply the same two properties directly. -->
        <label class="btn ghost mt18" style="width:100%${
          pending === 'shrink' ? ';opacity:.45;pointer-events:none' : ''}"${
          pending === 'shrink' ? raw(' aria-busy="true"') : ''}>
          ${pending === 'shrink' ? 'Shrinking it…' : 'Choose from phone'}
          <input type="file" id="cover-file" accept="image/*" hidden>
        </label>
        ${trip?.coverPhoto ? html`
          <button class="btn none mt8" style="width:100%;color:var(--danger-fg);height:38px"
                  data-act="cover-clear">Remove the photo</button>` : ''}
      </div>
    </section>`;
}

function mountCover(root) {
  const done = () => { covering = null; busy = ''; pending = ''; store.refreshTrips(); };
  delegate(root, '[data-act="cover-close"]', done);
  delegate(root, '[data-pick-tint]', async (el) => {
    if (covering !== state.tripID) {
      busy = 'Open this trip first to change its cover.';
      store.refreshTrips();
      return;
    }
    await store.setTripCover({ tint: el.dataset.pickTint, photo: '' });
    done();
  });
  delegate(root, '[data-pick-photo]', async (el) => {
    await store.setTripCover({ photo: el.dataset.pickPhoto });
    done();
  });
  delegate(root, '[data-act="cover-clear"]', async () => {
    await store.setTripCover({ photo: '' });
    done();
  });

  root.querySelector('#cover-file')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (covering !== state.tripID) {
      busy = 'Open this trip first to change its cover.';
      store.refreshTrips();
      return;
    }
    pending = 'shrink';
    busy = '';
    store.refreshTrips();
    try {
      // A cover is kept at thumbnail size inside the trip, so it draws with
      // no signal and costs almost nothing to sync.
      const { thumbnail } = await prepare(file);
      await store.setTripCover({ photo: thumbnail });
      done();
    } catch (error) {
      // R6/§6: the label reverts and the outcome takes the note slot, so the
      // control is live again immediately and a failure is retryable in one tap.
      pending = '';
      busy = error.message || 'That photo could not be used';
      store.refreshTrips();
    }
  });
}

// ---------------------------------------------------------------- the rest

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
  const line = store.currencyGuessLine(guess);
  return html`
    <div class="form">
      <div class="form-title">New trip</div>
      <input id="new-trip-name" placeholder="Where are you going?">
      ${nameError ? html`
        <div class="f11 lh145" style="color:var(--danger-fg);margin-top:-4px">${nameError}</div>` : ''}
      <input id="new-trip-place" placeholder="City or area (centres the map)">
      <!-- The derived line, in the slot the form hint already occupies: it is
           derived from the field above and changes when that field changes,
           so it is that field's own consequence. No new field, no new
           control, no second modal step (§3). Amber for a success because it
           is a GUESS — a silent correct guess and a silent wrong guess look
           identical, which is the reason the line exists at all. Rust for the
           two failures, because something the user asked for did not
           happen. -->
      <div class="f11 lh145" style="margin-top:-4px${
        line.tone === 'amber' ? ';color:var(--amber-fg)'
          : (line.tone === 'rust' ? ';color:var(--danger-fg)' : ';color:var(--soft)')}">${line.text}</div>
      <div class="row g8">
        <input id="new-trip-start" type="date" class="grow">
        <input id="new-trip-days" type="number" value="5" min="1" max="60" style="width:88px" aria-label="Days">
      </div>
      <div class="form-actions">
        <button class="btn jade grow" data-act="add-save"${
          pending === 'create' ? raw(' disabled aria-busy="true"') : ''}>${
          pending === 'create' ? 'Creating…' : 'Create'}</button>
        <!-- R11: Cancel is Create's family. It goes non-interactive without
             fading, so the only control carrying a visual state is the one
             that was pressed. -->
        <button class="btn ghost" style="width:96px${
          pending === 'create' ? ';pointer-events:none' : ''}" data-act="add-cancel">Cancel</button>
      </div>
      <!-- OD-9, answered "add the choice" on 5 Sep 2026 (review §13.1).
           ONE ghost, this exact label, landing on the trip just created per
           PR-2. Paste is still the default path and Create is still the
           primary; this is the way out that used to be the back gesture
           alone. -->
      <button class="btn ghost" style="width:100%" data-act="add-save-later"${
        pending === 'create' ? raw(' disabled') : ''}>I'll do this later</button>
      <div class="form-hint">
        It goes straight to pasting the itinerary in, which is the fastest way from an empty
        trip to a usable one. You can skip that and add stops one at a time instead.
      </div>
    </div>`;
}
