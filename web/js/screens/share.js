// Sharing one trip.
//
// The three behaviours are stated before the link, in the order people
// worry about them, because the shopping copy is the part that will bite
// someone six days into a trip and the only defence is having said it.
//
// Before anyone has it, this screen is a choice: the role and the expiry are
// picked first, so the link is never a thing you have to go back and fix.
// After that it is a list of people, one role each, and the link as a
// separate thing that can be switched off without turning anybody out.

import { html, raw, icon, esc, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back } from '../nav.js';
import { swipeToDelete } from './parts.js';
import { ROLES, EXPIRIES, linkURL, initialFor } from '../share.js';

let role = 'edit';
let expiry = '7d';
let withShopping = true;
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
    const unsent = store.unsentShopping();
    const copiedAt = store.shareState()?.shoppingCopiedAt;

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

          <div class="eyebrow">Who has it</div>
          <div class="card-list mb14">
            ${people.length ? people.map((p) => person(p)) : owner()}
            ${people.length ? '' : html`<div class="f12 soft" style="padding:10px 12px">Nobody else, yet.</div>`}
            ${shared ? html`
              <button class="btn-dashed" data-act="add">+ Add someone</button>` : ''}
          </div>
          ${people.length > 1 ? html`
            <div class="f11 soft lh145 mb18">
              Swipe a person left to remove them, the same as anywhere else. They lose the
              schedule; their shopping list and their whole Log were always theirs and stay.
            </div>` : ''}

          ${shared ? promise({ copiedAt, unsent }) : offer()}

          <div class="eyebrow">The link</div>
          ${link ? liveLink(link, live) : html`
            <div class="card" style="padding:13px 14px">
              <div class="f12 soft lh145 mb12">
                Send one link to the group chat. Whoever opens it joins this trip only —
                your other trips and your account stay yours.
              </div>
              <button class="btn jade" style="width:100%;height:46px" data-act="create">Create the link</button>
              <div class="f11 soft lh145 mt10">
                People who join keep the trip until you remove them, even after the link expires.
              </div>
            </div>`}
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

    delegate(root, '[data-act="shopping"]', () => {
      if (store.shareState()?.on) {
        store.setShareShopping(!store.shareState().shopping);
      } else {
        withShopping = !withShopping;
        repaint();
      }
    });

    delegate(root, '[data-act="create"]', () => {
      const made = store.createLink({ role, expiry, withShopping });
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

    delegate(root, '[data-act="send-items"]', () => {
      const n = store.sendNewShopping();
      notice = n ? `Sent ${n} item${n === 1 ? '' : 's'}. Nothing on their list was taken off.` : '';
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

    delegate(root, '[data-act="add"]', () => {
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

function person(p) {
  const open = changing === p.id;
  const body = html`
    <div class="linkrow">
      <div class="trip-mark">${initialFor(p.name)}</div>
      <div class="grow">
        <div class="linkrow-t">${p.name}</div>
        <div class="linkrow-s">
          ${p.role === 'owner' ? 'Made this trip' : `Joined ${store.stamp(p.joinedAt)}`}
        </div>
      </div>
      ${p.role === 'owner'
        ? html`<span class="badge">OWNER</span>`
        : html`<button class="chip" data-person="${p.id}">${ROLES[p.role]?.label || p.role}</button>`}
    </div>
    ${open ? html`
      <div class="chiprow" style="padding:0 12px 11px">
        ${['edit', 'read'].map((id) => html`
          <button class="pick-chip${p.role === id ? ' on' : ''}"
                  data-set-role="${id}" data-person2="${p.id}">${ROLES[id].label}</button>`)}
      </div>` : ''}`;

  if (p.role === 'owner') return body;

  return html`
    <div class="swipe-row" data-remove="${p.id}" data-name="${esc(p.name)}">
      <div class="swipe-bin">${raw(icon.bin)}</div>
      <div class="swipe-face">${body}</div>
    </div>`;
}

/** What they get, and — the part that matters — what they do not. */
function promise({ copiedAt, unsent }) {
  const on = store.shareState()?.shopping;
  return html`
    <div class="eyebrow">What they get</div>
    <div class="card mb14" style="padding:13px 14px">
      ${line('The schedule, the same for everyone', 'Stops, times, order, places, Must-see', 'jade')}
      ${line(
    on ? 'A copy of the shopping list, once' : 'No copy of your shopping list',
    on ? 'Not kept in step after that' : 'Turn it on below to send them a starting point',
    'amber',
  )}
      ${line('Nothing you’ve bought or packed', 'Your Log stays on this phone too', 'ink')}

      <button class="row g8 center mt13" data-act="shopping" style="width:100%">
        <span class="toggle${on ? ' on' : ''}"><i></i></span>
        <span class="f12 w650 grow left" style="color:var(--charcoal)">Include my shopping list</span>
      </button>
      ${on && copiedAt ? html`
        <div class="f11 soft lh145 mt8">
          Copied on ${store.stamp(copiedAt)}.
          ${unsent.length ? `You’ve added ${unsent.length} item${unsent.length === 1 ? '' : 's'} since — they don’t have those.` : 'Nothing added since.'}
        </div>
        ${unsent.length ? html`
          <button class="btn ghost mt10" style="width:100%" data-act="send-items">
            Send the ${unsent.length} new item${unsent.length === 1 ? '' : 's'}
          </button>
          <div class="f11 soft lh145 mt7">
            Only adds. Nothing you’ve crossed off is taken off their list.
          </div>` : ''}` : ''}
    </div>`;
}

/** Before anyone has it: the role and the expiry, chosen first. */
function offer() {
  return html`
    <div class="eyebrow">They will be able to</div>
    <div class="card-list mb14">
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

    <div class="eyebrow">Link stops working after</div>
    <div class="chiprow mb8">
      ${EXPIRIES.map((e) => html`
        <button class="pick-chip${expiry === e.id ? ' on' : ''}" data-expiry="${e.id}">${e.label}</button>`)}
    </div>

    <button class="row g8 center mb18" data-act="shopping" style="width:100%">
      <span class="toggle${withShopping ? ' on' : ''}"><i></i></span>
      <span class="f12 w650 grow left" style="color:var(--charcoal)">Include my shopping list</span>
    </button>
    <div class="f11 soft lh145 mb18" style="margin-top:-12px">
      A copy is taken the moment you create the link, and the two lists then live their own
      lives. Nothing you buy or pack is ever in the share.
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
