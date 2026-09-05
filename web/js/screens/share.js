// Sharing one trip.
//
// What you are handing over is a copy, and the sheet says so before it says
// anything else — because "shared" makes almost everyone assume live sync,
// and this is not that. Nothing anyone changes reaches anyone else until
// somebody presses Send an update, and even then it is reviewed a change at
// a time on the far side.
//
// Before anyone has it, this screen is a choice: the role and the expiry are
// picked first, so the link is never a thing you have to go back and fix.
// After that it is a list of people, one role each, an update button that
// says how much there is to send, and the link as a separate thing that can
// be switched off without turning anybody out.

import { html, raw, icon, esc, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back } from '../nav.js';
import { swipeToDelete } from './parts.js';
import { ROLES, EXPIRIES, linkURL, initialFor } from '../share.js';

let role = 'edit';
let expiry = '7d';
let notice = '';
/** Which person's role is open for changing. */
let changing = null;

const repaint = () => store.selectDay(state.selectedDay);

export default {
  id: 'share',
  tab: null,

  render() {
    const link = state.trip?.link || null;
    const people = store.sharePeople();
    const live = store.linkState() === 'live';
    const shared = Boolean(store.shareState()?.on);
    const unsent = store.unsentChanges();
    const sharedFrom = state.trip?.sharedFrom || null;
    // P0-1 · the role finally reaches a screen. `read` cannot publish, so the
    // controls that publish are not rendered for them at all.
    const canSend = store.canPublish();
    const owns = store.isOwner();

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
            <div class="grow">
              <div class="push-title">Share this trip</div>
              <div class="push-sub">
                ${state.trip?.name || 'This trip'}${people.length > 1 ? ` · ${people.length} people` : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 28px">
          ${notice ? html`<div class="amber-note mb12">${notice}</div>` : ''}

          ${sharedFrom ? relationship(store.ownerName(), store.linkHasStopped()) : ''}

          ${canSend ? '' : readSendBlock(store.ownerName())}

          <div class="eyebrow">Who has it</div>
          <div class="card-list mb14">
            ${people.length ? people.map((p) => person(p, owns)) : owner()}
            ${people.length ? '' : html`<div class="f12 soft" style="padding:10px 12px">Nobody else, yet.</div>`}
            ${shared && owns ? html`
              <button class="btn-dashed" data-act="resend">Resend the link</button>` : ''}
          </div>
          <!-- §4.3 · the swipe hint describes a gesture a non-owner does not
               have, so it is the owner's. In its place the non-owner gets the
               jade explainer that says who does look after the trip. -->
          ${people.length > 1 && owns ? html`
            <div class="f11 soft lh145 mb18">
              Swipe a person left to remove them, the same as anywhere else. They keep the
              copy of the itinerary they already have, and stop receiving your updates.
            </div>` : ''}
          ${people.length > 1 && !owns ? html`
            <div class="hint-jade mb18">
              ${store.ownerName()} looks after who is on this trip and sends its updates.
            </div>` : ''}

          ${shared && canSend ? sending(unsent) : ''}

          <!-- A joined copy has sharedFrom, not link, so every control in
               the link section is already inert for a non-owner. It is
               hidden rather than shown dead: P0-1's rule that a control which
               cannot act should not exist. -->
          ${owns ? html`
            <div class="eyebrow">${link ? 'The link' : 'Make a link'}</div>
            ${link ? liveLink(link, live) : offer()}` : ''}
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => { notice = ''; changing = null; back(); });

    delegate(root, '[data-role]', (el) => {
      role = el.dataset.role;
      repaint();
    });
    delegate(root, '[data-expiry]', (el) => {
      expiry = el.dataset.expiry;
      if (state.trip?.link) store.setLinkExpiry(expiry);
      else repaint();
    });


    delegate(root, '[data-act="create"]', () => {
      const made = store.createLink({ role, expiry });
      const lasts = EXPIRIES.find((e) => e.id === expiry);
      notice = made
        ? `Link made. Whoever opens it joins as ${ROLES[role].label.toLowerCase()}, and it stops `
          + `working ${lasts.hours ? `after ${lasts.label.toLowerCase()}` : 'when the trip ends'}.`
        : '';
      repaint();
    });

    delegate(root, '[data-act="link-off"]', () => { store.setLinkLive(false); });
    delegate(root, '[data-act="link-on"]', () => { store.setLinkLive(true); });

    delegate(root, '[data-act="copy"]', async (el) => {
      const url = el.dataset.url;
      try {
        await navigator.clipboard.writeText(url);
        notice = 'Link copied.';
      } catch {
        notice = url;
      }
      repaint();
    });

    delegate(root, '[data-act="send"]', async (el) => {
      const url = el.dataset.url;
      const text = `${store.ownerName()} is sharing a trip with you: ${state.trip?.name || 'a trip'} — ${url}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: state.trip?.name || 'A trip', text, url });
          return;
        } catch {
          // Cancelled, or no share sheet. The copy below is the fallback.
        }
      }
      try {
        await navigator.clipboard.writeText(text);
        notice = 'Message copied — paste it into the group chat.';
      } catch {
        notice = text;
      }
      repaint();
    });

    delegate(root, '[data-act="send-update"]', () => {
      const n = store.unsentChanges().length;
      const sent = store.publishUpdate();
      notice = sent
        ? `Sent. ${n} change${n === 1 ? '' : 's'} are waiting for them to review — nothing on `
          + 'their copy has moved on its own.'
        : '';
      repaint();
    });

    delegate(root, '[data-person]', (el) => {
      changing = changing === el.dataset.person ? null : el.dataset.person;
      repaint();
    });
    delegate(root, '[data-set-role]', (el) => {
      store.setPersonRole(el.dataset.person2, el.dataset.setRole);
      changing = null;
    });

    delegate(root, '[data-act="resend"]', () => {
      notice = 'Send the link again — whoever opens it joins as '
        + `${ROLES[state.trip?.link?.role || 'read'].label.toLowerCase()}.`;
      repaint();
    });

    swipeToDelete(root, {
      rowSelector: '.swipe-row[data-remove]',
      label: 'Remove',
      name: (row) => row.dataset.name || 'this person',
      onDelete: (row) => store.removePerson(row.dataset.remove),
    });
  },
};

/**
 * The thing this screen could not say before an owner could see who joined:
 * a joiner's own Share screen otherwise looks exactly like the real owner's,
 * with no sign that "Create the link" here starts a second, disconnected
 * share rooted at this phone's fork rather than at the trip itself.
 */
function relationship(ownerName, stopped = false) {
  return html`
    <div class="card mb14" style="padding:12px 13px;background:var(--jade-bg);border-color:var(--jade-bd)">
      <div class="f12 w650" style="color:var(--jade)">This is your copy of ${ownerName}’s trip.</div>
      <!-- N-13 · same block, same jade, one different sentence. JADE, not
           rust: nothing has failed on this phone and nothing is lost — the
           copy is complete and working, and rust would be the second time the
           app told a user their working trip was damaged. There is no tap
           that fixes it, so by the house rule it is not a warning: it is a
           fact, available where the question is asked, and nowhere else. No
           banner on the Plan, no chip, no strip. -->
      <div class="f11 lh145 mt5" style="color:var(--jade-fg)">
        ${stopped
          ? html`${ownerName}’s link has stopped working, so no more updates can arrive.
                 Everything on this phone stays as it is.`
          : html`What you publish below is a second, separate share — of your copy, not ${ownerName}’s.
                 Anyone who joins through it gets what you have right now, not a live view of
                 ${ownerName}’s trip.`}
      </div>
    </div>`;
}

/** You, on a trip nobody has yet. */
function owner() {
  const who = store.me();
  return html`
    <div class="linkrow">
      <div class="trip-mark">${initialFor(who.name)}</div>
      <div class="grow">
        <div class="linkrow-t">${who.name}</div>
        <div class="linkrow-s">Made this trip</div>
      </div>
      <span class="badge">OWNER</span>
    </div>`;
}

function person(p, owns = true) {
  const open = changing === p.id && owns;
  const body = html`
    <div class="linkrow">
      <div class="trip-mark">${initialFor(p.name)}</div>
      <div class="grow">
        <div class="linkrow-t">${p.name}</div>
        <div class="linkrow-s">
          ${p.role === 'owner' ? 'Made this trip' : `Joined ${store.stamp(p.joinedAt)}`}
        </div>
      </div>
      ${p.id === store.me().id ? html`<span class="mine-chip">YOU</span>` : ''}
      <!-- The chip-versus-badge decision, and it is not carried by colour:
           .badge is the provenance family — flat, uppercase, never
           interactive — and .chip is inline metadata that becomes
           explicitly interactive by gaining the caret the app already uses
           for "this opens something". A caret means you can change it, which
           is legible without reading and survives greyscale. -->
      ${p.role === 'owner'
        ? html`<span class="badge">OWNER</span>`
        : (owns
          ? html`<button class="chip" data-person="${p.id}">
                   ${ROLES[p.role]?.label || p.role}
                   <span class="none" style="opacity:.55">${raw(icon.caret)}</span>
                 </button>`
          : html`<span class="badge">${(ROLES[p.role]?.label || p.role).toUpperCase()}</span>`)}
    </div>
    ${open ? html`
      <div class="chiprow" style="padding:0 12px 11px">
        ${['edit', 'read'].map((id) => html`
          <button class="pick-chip${p.role === id ? ' on' : ''}"
                  data-set-role="${id}" data-person2="${p.id}">${ROLES[id].label}</button>`)}
      </div>` : ''}`;

  // Only the owner can take somebody off the trip, so only the owner's rows
  // are swipeable. A non-owner's row is a display.
  if (p.role === 'owner' || !owns) return body;

  return html`
    <div class="swipe-row" data-remove="${p.id}" data-name="${esc(p.name)}">
      <div class="swipe-bin">${raw(icon.bin)}</div>
      <div class="swipe-face">${body}</div>
    </div>`;
}

/** What sharing does, and — the part that matters — what it does not. */
function sending(unsent) {
  return html`
    <div class="eyebrow">What they get</div>
    <div class="card mb14" style="padding:13px 14px">
      ${line('A copy of the itinerary', 'The stops, the sub routes, the places and the must-see spots', 'jade')}
      ${line('Nothing else, ever',
    'Your shopping list, your packing list and your whole Log are not in it', 'ink')}
      ${line('And it is a copy',
    'What they change stays on their phone, and what you change stays on yours', 'amber')}

      <div class="hairline"></div>

      <div class="f12 w650" style="color:var(--ink)">
        ${unsent.length
    ? `${unsent.length} change${unsent.length === 1 ? '' : 's'} since you last sent one`
    : 'They have everything you have sent'}
      </div>
      <div class="f11 soft lh145 mt4">
        ${unsent.length
    ? 'They review it a change at a time — nothing is applied to their day for them.'
    : 'Change something and this will say what there is to send.'}
      </div>
      <button class="btn ${unsent.length ? 'jade' : 'ghost'} wide mt10"
              data-act="send-update"${unsent.length ? '' : ' disabled'}>
        ${unsent.length ? `Send ${unsent.length} change${unsent.length === 1 ? '' : 's'}` : 'Nothing to send'}
      </button>
    </div>`;
}

/**
 * P0-1 §4.4 — what a `read` user sees where the send button is.
 *
 * The button is NOT RENDERED, rather than rendered disabled. A disabled
 * control still asserts the action is yours and merely unavailable right now,
 * which is what a disabled `Nothing to send` correctly means for an owner
 * with nothing to send. For a `read` user the action is not theirs at all, so
 * a permanently disabled primary would be a standing accusation with no fix.
 *
 * Until now `myRole()` reached no screen at all, so a `read` user was shown an
 * ENABLED send control that silently did nothing — the oldest confirmed gap in
 * the readiness map, and the exact interaction failure the whole silent-refusal
 * rule exists to stop.
 *
 * And nothing here names the absent button: naming the absence would
 * re-introduce the refusal in words. It says who does send, and stops.
 */
function readSendBlock(ownerName) {
  return html`
    <div class="hint-jade mb14">
      <div class="eyebrow jade">YOUR CHANGES</div>
      <div class="mt6">
        Everything you change stays on your copy. ${ownerName} sends the updates for this trip.
      </div>
    </div>`;
}

/**
 * Before anyone has it: role, then expiry, then the button they both feed —
 * one card, top to bottom, so picking either visibly leads to Create the
 * link rather than reading as a separate setting.
 */
function offer() {
  return html`
    <div class="card mb14" style="padding:12px 13px;background:var(--jade-bg);border-color:var(--jade-bd)">
      <div class="f12 w650" style="color:var(--jade)">They get a copy, not a live view.</div>
      <div class="f11 lh145 mt5" style="color:var(--jade-fg)">
        Whatever either of you changes stays on your own phone. When you want them to have
        your changes you send an update, and they choose what to take from it. Your shopping
        list, your packing list and your Log are never in it at all.
      </div>
    </div>

    <div class="card pad">
      <div class="eyebrow">1 · They will be able to</div>
      <div class="card-list mt8 mb10">
        ${['edit', 'read'].map((id) => html`
          <button class="linkrow left" data-role="${id}" style="width:100%">
            <span class="radio${role === id ? ' on' : ''}"></span>
            <span class="grow">
              <span class="linkrow-t">${ROLES[id].label.replace('Can ', '').replace(/^./, (c) => c.toUpperCase())}</span>
              <span class="linkrow-s">${ROLES[id].can}</span>
            </span>
          </button>`)}
      </div>
      <div class="f11 soft lh145 mb18">You can change this per person afterwards.</div>

      <div class="eyebrow">2 · Link stops working after</div>
      <div class="chiprow mt8 mb18">
        ${EXPIRIES.map((e) => html`
          <button class="pick-chip${expiry === e.id ? ' on' : ''}" data-expiry="${e.id}">${e.label}</button>`)}
      </div>

      <div class="eyebrow mb8">3 · Send it</div>
      <button class="btn jade wide" style="height:46px" data-act="create">Create the link</button>
      <div class="f11 soft lh145 mt10">
        Whoever opens it joins this trip only — your other trips and your account stay yours.
        They keep it until you remove them, even after the link expires.
      </div>
    </div>`;
}

function line(title, sub, tone) {
  return html`
    <div class="row g10 mb11" style="align-items:flex-start">
      <span class="dot ${tone}" style="margin-top:6px"></span>
      <span class="grow">
        <span class="f12 w650 block" style="color:var(--ink)">${title}</span>
        <span class="f11 soft block lh145">${sub}</span>
      </span>
    </div>`;
}

function liveLink(link, live) {
  const url = linkURL(link.code, location.origin);
  return html`
    <div class="card" style="padding:13px 14px">
      <div class="row g8 center mb9">
        <span class="badge ${live ? 'jade' : 'rust'}">${live ? 'LIVE' : 'OFF'}</span>
        <span class="grow f12 w650 tnum" style="color:var(--ink);word-break:break-all">${url}</span>
      </div>
      <div class="f11 soft mb12">
        Joins as ${(ROLES[link.role]?.label || link.role).toLowerCase()} ·
        ${link.expiresAt ? `expires ${store.stamp(link.expiresAt)}` : 'lasts until the trip ends'} ·
        opened ${link.opens || 0} time${(link.opens || 0) === 1 ? '' : 's'}
      </div>
      <div class="chiprow mb2">
        ${EXPIRIES.map((e) => html`
          <button class="pick-chip${link.expiry === e.id ? ' on' : ''}" data-expiry="${e.id}">${e.label}</button>`)}
      </div>
      <div class="row g8 mt12">
        <button class="btn jade grow" data-act="send" data-url="${esc(url)}">Send it</button>
        <button class="btn ghost none" style="width:88px" data-act="copy" data-url="${esc(url)}">Copy</button>
      </div>
      <button class="btn ghost mt10" style="width:100%"
              data-act="${live ? 'link-off' : 'link-on'}">${live ? 'Turn the link off' : 'Turn the link back on'}</button>
      <div class="f11 soft lh145 mt8">
        ${live
    ? 'Turning it off stops new people joining. Everyone who already has the trip keeps it.'
    : 'Nobody new can join. Everyone who already has the trip still has it.'}
      </div>
    </div>`;
}
