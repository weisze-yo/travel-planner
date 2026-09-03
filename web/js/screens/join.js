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

import { html, raw, icon, esc, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { linkURL, linkState, LINK_DEAD_LINES, initialFor } from '../share.js';

/** 'look' → 'signin' → in. */
let phase = 'look';
let email = '';
let notice = '';

const repaint = () => store.selectDay(state.selectedDay);

export default {
  id: 'join',
  tab: null,
  /** No tab bar: whoever opened this link is not in the app yet. */
  chrome: false,

  render(params = {}) {
    const trip = state.trip;
    const link = trip?.link || null;
    const joined = store.sharePeople().some((p) => p.id === store.me().id);
    const kind = params.as || linkState(link, { joined });
    const url = linkURL(link?.code || '????-????', location.origin);
    const owner = store.ownerName();

    if (kind !== 'live' && kind !== 'joined') return dead(kind, url, owner, link);
    if (phase === 'signin') return signIn(trip, notice);

    const first = state.days.find((d) => store.activeItems(d).length) || state.days[0];
    const stops = first ? store.activeItems(first).slice(0, 3) : [];

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
            <div class="join-name">${String(trip?.name || 'A trip').split('·')[0].trim()}</div>
            <div class="join-sub">${String(trip?.name || '').split('·').slice(1).join('·').trim()}</div>
            <div class="join-meta">${tripLine(trip)}</div>
          </div>

          <div class="join-look">
            <div class="row center mb10">
              <div class="eyebrow grow">
                Day ${first?.dayNumber || 1}${first?.dateLabel ? ` · ${first.dateLabel}` : ''}
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
            <div class="join-more">and ${Math.max(0, (trip?.dayCount || 1) - 1)} more days</div>
          </div>

          <div style="padding:18px 16px 0">
            <div class="eyebrow mb10">If you join</div>
            ${promise('You get the schedule and every place on it, and it stays the same on '
              + 'everyone’s phone. You can change it too.')}
            ${store.shareState()?.shopping
    ? promise(`You get a copy of ${owner}’s shopping list to start from. Yours is then your own.`)
    : promise('Your shopping list stays your own — nothing is copied in.')}
            ${promise('It works with no signal once you have opened it.')}

            <div class="card mt14" style="padding:12px 13px;background:var(--jade-bg);border-color:var(--jade-bd)">
              <div class="f12 w650" style="color:var(--jade)">Your side stays yours.</div>
              <div class="f11 lh145 mt5" style="color:var(--jade-fg)">
                What you buy, what you pack and anything you write in your Log are never shown
                to ${owner} or anyone else on this trip.
              </div>
            </div>
          </div>
        </div>

        <div class="join-foot">
          <button class="btn jade" style="width:100%;height:50px" data-act="join">
            ${kind === 'joined' ? 'Open this trip' : 'Join this trip'}
          </button>
          <div class="join-fine">
            You sign in next, so the trip follows you to a new phone.
            ${link?.expiresAt ? `Link expires ${store.stamp(link.expiresAt)}.` : ''}
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="join"]', () => {
      store.joinTrip();
      phase = store.signedIn() ? 'look' : 'signin';
      if (phase === 'look') go('plan');
      else repaint();
    });

    delegate(root, '[data-provider]', (el) => {
      const provider = el.dataset.provider;
      if (provider === 'email') {
        const value = root.querySelector('[data-field="email"]')?.value?.trim() || '';
        if (!value.includes('@')) {
          notice = 'That does not look like an email address.';
          repaint();
          return;
        }
        email = value;
        store.signIn({ provider: 'email', name: value.split('@')[0], email: value });
      } else {
        // Apple and Google both need a real client id and a redirect this app
        // cannot own from a file:// or a static host, so the name is asked
        // for instead of pretended. Nothing else about the flow changes.
        const value = root.querySelector('[data-field="name"]')?.value?.trim() || '';
        if (!value) {
          notice = 'One line: the name other travellers will see on what you change.';
          repaint();
          return;
        }
        store.signIn({ provider, name: value });
      }
      phase = 'look';
      notice = '';
      go('plan');
    });

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
function tripLine(trip) {
  const range = String(trip?.dateRange || '').trim();
  const days = trip?.dayCount || 0;
  const stops = state.days.reduce((n, d) => n + store.activeItems(d).length, 0);
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
  return html`
    <section class="screen">
      <div class="join-bar">${raw(icon.lock || '')}<span>${url}</span></div>
      <div class="scroll" style="padding:26px 18px">
        <div class="badge rust mb12">
          ${kind === 'off' ? 'THIS LINK IS SWITCHED OFF' : 'THIS LINK HAS EXPIRED'}
        </div>
        <div class="join-name" style="font-size:19px">${state.trip?.name || 'This trip'}</div>
        <div class="f12 lh15 mt10" style="color:var(--muted)">
          ${kind === 'off' ? LINK_DEAD_LINES.off(owner) : LINK_DEAD_LINES.expired(owner, on)}
        </div>
        <button class="btn jade mt18" style="width:100%;height:46px" data-act="ask">
          Ask ${owner} for a new link
        </button>
        <div class="f11 soft lh145 mt8">
          Opens a message to whoever sent this, with the trip name already in it.
        </div>

        <div class="eyebrow mt18 mb10">The other two endings</div>
        ${ending('You already have this trip', 'No error at all — the link opens the trip on Day 1. '
          + 'A second tap on an old message should never look like a failure.')}
        ${ending('You are offline', 'Joining needs signal once. The screen says so plainly and keeps '
          + 'the link, so the tap works later without going back to the chat.')}
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
function signIn(trip, warn) {
  return html`
    <section class="screen">
      <div class="scroll" style="padding:22px 18px 28px">
        <div class="join-name" style="font-size:20px">${String(trip?.name || '').split('·')[0].trim()}</div>
        <div class="join-meta mb18">${tripLine(trip)}</div>

        <div class="f16 w800 mb6" style="color:var(--ink);font-size:17px">Who are you?</div>
        <div class="f12 soft lh145 mb14">
          One tap. It is how your name appears on a note you write, and how you get the trip
          back on a new phone.
        </div>

        ${warn ? html`<div class="amber-note mb12">${warn}</div>` : ''}

        <label class="f11 soft block mb6">The name other travellers see</label>
        <input class="paid-input mb12" style="width:100%" data-field="name"
               value="${esc(store.me().name === 'You' ? '' : store.me().name)}" placeholder="Ana Lim">
        <button class="sign-btn dark" data-provider="apple">Continue with Apple</button>
        <button class="sign-btn" data-provider="google">Continue with Google</button>

        <div class="eyebrow mt14 mb8">Or use my email</div>
        <input class="paid-input mb9" style="width:100%" data-field="email" type="email"
               value="${esc(email)}" placeholder="you@example.com">
        <button class="sign-btn" data-provider="email">Use my email instead</button>

        <div class="eyebrow mt18 mb8">Already made a trip on this phone?</div>
        <div class="f12 soft lh145">
          It comes with you. Signing in moves what is on this phone into your account —
          nothing is replaced and nothing is lost.
        </div>
        <button class="btn ghost mt14" style="width:100%" data-act="later">Not now</button>
        <div class="f11 soft lh145 mt8">
          Your name is the only thing other travellers see.
        </div>
      </div>
    </section>`;
}
