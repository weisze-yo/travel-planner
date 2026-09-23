// What the invited person sees, and the sign-in that follows.
//
// Opened in a browser by someone who has never seen this app, so the trip
// comes first and the signup does not come at all: name, dates, who invited
// them, a real read-only look at Day 1, and one button. What they get is
// stated as three promises, and the third — your side stays yours — is the
// one that makes the other two safe to accept.
//
// Sign-in waits until after they have said yes. It exists for two reasons
// only: so a name can appear on what they change, and so the trip follows
// them to a new phone.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { linkURL, linkState, LINK_DEAD_LINES, initialFor } from '../share.js';
import { signInPanel, mountSignIn } from './parts.js';

/** 'look' → 'signin' → in. */
let phase = 'look';
let notice = '';
/**
 * Which control is doing async work — a key, never a free string (P0-5 R1).
 * Join is one of the three flows whose surface IS the work (R8), so the
 * sticky foot stays up and carries it.
 */
let pending = '';

const repaint = () => store.selectDay(state.selectedDay);

/**
 * What this screen is looking at. On the phone that made the link that is the
 * trip itself; on the phone that was *sent* the link it is the envelope, which
 * is all there is until a copy is taken. Both answer the same questions, so
 * the screen below does not care which it got.
 */
function invited() {
  const invite = state.invite;
  const snapshot = invite?.envelope?.snapshot || null;
  if (!snapshot) {
    const trip = state.trip;
    return {
      code: trip?.link?.code || null,
      name: trip?.name || 'A trip',
      dateRange: trip?.dateRange || '',
      dayCount: trip?.dayCount || 0,
      days: state.days,
      owner: store.ownerName(),
      role: trip?.link?.role || 'read',
      link: trip?.link || null,
      known: Boolean(trip),
    };
  }
  return {
    code: invite.code,
    name: snapshot.tripName || 'A trip',
    dateRange: snapshot.dateRange || '',
    dayCount: snapshot.dayCount || 0,
    days: snapshot.days || [],
    owner: snapshot.byName || 'the owner',
    role: invite.envelope.linkRole || 'read',
    link: {
      code: invite.code,
      role: invite.envelope.linkRole || 'read',
      live: invite.envelope.live !== false,
      expiresAt: invite.envelope.expiresAt || null,
    },
    known: true,
  };
}

/**
 * "Day 1", and the date if there is one. A trip with no dates labels its days
 * "Day 1" already, so printing both reads as a bug rather than as detail.
 */
function dayHeading(day) {
  const n = day?.dayNumber || 1;
  const label = String(day?.dateLabel || '').trim();
  return label && label !== `Day ${n}` ? `Day ${n} · ${label}` : `Day ${n}`;
}

/** The stops of the first day that has any, from wherever they came. */
function firstDay(seen) {
  const days = seen.days || [];
  const has = (d) => (state.invite?.envelope
    ? (d.items || []).filter((i) => !i.removed && !i.isSubRouteSummary)
    : store.activeItems(d));
  const found = days.find((d) => has(d).length) || days[0] || null;
  return { day: found, stops: found ? has(found).slice(0, 3) : [] };
}

export default {
  id: 'join',
  tab: null,
  /** No tab bar: whoever opened this link is not in the app yet. */
  chrome: false,

  render(params = {}) {
    const seen = invited();
    const link = seen.link;
    const joined = store.sharePeople().some((p) => p.id === store.me().id);
    const kind = params.as || linkState(link, { joined });
    const url = linkURL(seen.code || '????-????', location.origin);
    const owner = seen.owner;

    // A code that reaches nothing: either it was never published, or this
    // phone has no signal and has never seen it. Both are dead ends with the
    // same shape, and the second one says so rather than blaming the link.
    if (state.invite && !state.invite.envelope) {
      return dead(state.invite.reached ? 'off' : 'offline', url, owner, null);
    }
    if (kind !== 'live' && kind !== 'joined') return dead(kind, url, owner, link);
    if (phase === 'signin') return signIn(seen, notice);

    const { day: first, stops } = firstDay(seen);

    return html`
      <section class="screen">
        <div class="join-bar">${raw(icon.lock || '')}<span>${url}</span></div>

        <div class="scroll join">
          <div class="join-head">
            <div class="join-from">
              <div class="who-mark">${initialFor(owner)}</div>
              <div class="f12" style="color:var(--muted)">
                <b style="color:var(--ink)">${owner}</b> is sharing a trip with you
              </div>
            </div>
            <div class="join-name">${String(seen.name).split('·')[0].trim()}</div>
            <div class="join-sub">${String(seen.name).split('·').slice(1).join('·').trim()}</div>
            <div class="join-meta">${tripLine(seen)}</div>
          </div>

          <div class="join-look">
            <div class="row center mb10">
              <div class="eyebrow grow">
                ${dayHeading(first)}
              </div>
              <div class="f11 soft">a look at it</div>
            </div>
            ${stops.map((item) => html`
              <div class="row g10 mb9" style="align-items:flex-start">
                <span class="f12 w650 tnum" style="width:44px;color:var(--ink)">${item.time || ''}</span>
                <span class="grow">
                  <span class="f12 w650 block" style="color:var(--ink)">${item.name}</span>
                  ${item.subtitle ? html`<span class="f11 soft block">${item.subtitle}</span>` : ''}
                </span>
              </div>`)}
            <div class="join-more">and ${Math.max(0, (seen.dayCount || 1) - 1)} more days</div>
          </div>

          <div style="padding:18px 16px 0">
            <div class="eyebrow mb10">If you join</div>
            ${promise(`You get a copy of ${owner}’s itinerary — every stop, the sub routes, `
              + 'the places saved around them and the must-see spots.')}
            ${promise('It is yours from then on. Change anything you like; nothing you do here '
              + 'is sent to anyone.')}
            ${promise(`When ${owner} changes something you are told, and you choose what to `
              + 'take from it one thing at a time.')}
            ${promise('It works with no signal once you have opened it.')}

            <div class="card mt14" style="padding:12px 13px;background:var(--jade-bg);border-color:var(--jade-bd)">
              <div class="f12 w650" style="color:var(--jade)">Your side stays yours.</div>
              <div class="f11 lh145 mt5" style="color:var(--jade-fg)">
                Your shopping list, your packing list and everything you write in your Log stay
                on this phone. They are not part of a shared trip at all, so ${owner} cannot see
                them and no update can touch them.
              </div>
            </div>
          </div>
        </div>

        <div class="join-foot">
          <button class="btn jade" style="width:100%;height:50px" data-act="join"${
            pending === 'join' ? raw(' disabled aria-busy="true"') : ''}>
            ${pending === 'join'
              ? 'Making your copy…'
              : (kind === 'joined' ? 'Open this trip' : 'Join this trip')}
          </button>
          <div class="join-fine">
            You sign in next, so the trip follows you to a new phone.
            ${link?.expiresAt ? `Link expires ${store.stamp(link.expiresAt)}.` : ''}
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="join"]', async () => {
      // Joining makes your own copy of the trip, so it is a write and takes
      // a moment; the screen says so rather than looking stuck.
      if (pending) return;
      const seen = invited();
      pending = 'join';
      notice = '';
      repaint();
      await store.joinTrip({ code: seen.code, role: seen.role });
      pending = '';
      phase = store.signedIn() ? 'look' : 'signin';
      if (phase === 'look') go('plan');
      else repaint();
    });

    // Signing in is the same sheet as everywhere else. An emailed link is not
    // finished here — it finishes on the launch that opens it — so the screen
    // says so and stays put rather than pretending.
    mountSignIn(root, { onDone: () => { phase = 'look'; go('plan'); } });

    delegate(root, '[data-act="later"]', () => { phase = 'look'; go('plan'); });
    delegate(root, '[data-act="ask"]', async () => {
      const text = `Could you send me a new link for ${state.trip?.name || 'the trip'}?`;
      try {
        await navigator.clipboard.writeText(text);
        notice = 'Message copied.';
      } catch {
        notice = text;
      }
      repaint();
    });
  },
};

/**
 * The trip in one line. The date range on a real trip already says how many
 * days it is, so counting them again reads as a bug rather than as detail.
 */
function tripLine(seen) {
  const range = String(seen?.dateRange || '').trim();
  const days = seen?.dayCount || 0;
  const stops = (seen?.days || []).reduce(
    (n, d) => n + (d.items || []).filter((i) => !i.removed && !i.isSubRouteSummary).length,
    0,
  );
  const parts = [range];
  if (days && !/\bdays?\b/.test(range)) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (stops) parts.push(`${stops} stop${stops === 1 ? '' : 's'}`);
  return parts.filter(Boolean).join(' · ');
}

function promise(text) {
  return html`
    <div class="row g10 mb10" style="align-items:flex-start">
      <span class="dot" style="margin-top:7px"></span>
      <span class="f12 lh145 grow" style="color:var(--charcoal)">${text}</span>
    </div>`;
}

/**
 * A link that no longer works. It still says which trip and who to ask — a
 * dead end with no name on it is the worst version of this.
 */
function dead(kind, url, owner, link) {
  const on = link?.expiresAt ? store.stamp(link.expiresAt) : '';
  // A link this phone cannot reach is not the same as one that has been
  // switched off, and saying so is the difference between "try again in a
  // minute" and "go back to the chat and ask".
  const badge = {
    off: 'THIS LINK IS SWITCHED OFF',
    offline: 'THIS PHONE CANNOT REACH IT',
  }[kind] || 'THIS LINK HAS EXPIRED';
  const line = {
    off: LINK_DEAD_LINES.off(owner),
    offline: 'Opening a shared trip needs signal, once. The link keeps working — try it '
      + 'again when you have some, and nothing about it has to be sent to you twice.',
  }[kind] || LINK_DEAD_LINES.expired(owner, on);

  return html`
    <section class="screen">
      <div class="join-bar">${raw(icon.lock || '')}<span>${url}</span></div>
      <div class="scroll" style="padding:26px 18px">
        <div class="badge rust mb12">${badge}</div>
        <div class="join-name" style="font-size:19px">${state.trip?.name || 'This trip'}</div>
        <div class="f12 lh15 mt10" style="color:var(--muted)">${line}</div>
        <button class="btn jade mt18" style="width:100%;height:46px" data-act="ask">
          Ask ${owner} for a new link
        </button>
        <div class="f11 soft lh145 mt8">
          Opens a message to whoever sent this, with the trip name already in it.
        </div>

        <div class="eyebrow mt18 mb10">The other endings</div>
        ${ending('You already have this trip', 'No error at all — the link opens the trip on Day 1. '
          + 'A second tap on an old message should never look like a failure.')}
        ${kind === 'offline' ? '' : ending('You are offline', 'Joining needs signal once. The screen '
          + 'says so plainly and keeps the link, so the tap works later without going back to the chat.')}
      </div>
    </section>`;
}

function ending(title, body) {
  return html`
    <div class="card mb10" style="padding:11px 13px">
      <div class="f12 w650" style="color:var(--ink)">${title}</div>
      <div class="f11 soft lh145 mt4">${body}</div>
    </div>`;
}

/** Sign in, at the last possible moment, with the trip still behind it. */
function signIn(seen, warn) {
  return html`
    <section class="screen">
      <div class="scroll" style="padding:22px 18px 28px">
        <div class="join-name" style="font-size:20px">${String(seen.name).split('·')[0].trim()}</div>
        <div class="join-meta mb18">${tripLine(seen)}</div>

        ${warn ? html`<div class="amber-note mb12">${warn}</div>` : ''}
        ${signInPanel({
          title: 'Who are you?',
          sub: 'One tap. It is how your name appears on a note you write, and how you get the '
            + 'trip back on a new phone.',
        })}

        <div class="eyebrow mt18 mb8">Already made a trip on this phone?</div>
        <div class="f12 soft lh145">
          It comes with you, under the id it already has, so a link you have handed out still
          points at it. Nothing is replaced and nothing is lost. The sample trip is the one
          exception: it stays on the phone rather than moving into your account.
        </div>
        <button class="btn ghost mt14" style="width:100%" data-act="later">Not now</button>
        <div class="f11 soft lh145 mt8">
          Your name is the only thing other travellers see.
        </div>
      </div>
    </section>`;
}
