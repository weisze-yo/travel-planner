// An update, one change at a time.
//
// This is where two copies of a trip meet. Somebody moved a stop, added a
// place, dropped a sub route; you have your own copy and may have changed
// the same things. Nothing has happened to your day yet and nothing will
// until you press Take on a row.
//
// So there is no conflict here, in the technical sense — only a list of
// differences with two sides shown, yours on the left and theirs on the
// right, and one decision each. Whatever you skip is not asked about again,
// and the ones you take are written through the same mutations the Plan
// uses, so an accepted change is indistinguishable from one you made.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back, go } from '../nav.js';

let done = 0;

export default {
  id: 'review',
  tab: 'plan',

  render() {
    const waiting = store.pendingUpdate();

    if (!waiting) {
      return html`
        <section class="screen">
          <div class="head">
            <div class="head-row center">
              <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
              <div class="grow">
                <div class="push-title">Nothing to review</div>
                <div class="push-sub">${state.trip?.name || 'This trip'}</div>
              </div>
            </div>
          </div>
          <div class="scroll" style="padding:16px">
            <div class="empty">
              ${done
                ? `Done — ${done} change${done === 1 ? '' : 's'} dealt with. Your copy is yours again until the next update arrives.`
                : 'Their copy and yours say the same thing. An update appears here when somebody sends one.'}
            </div>
            <button class="btn jade wide mt14" data-act="to-plan">Back to the day</button>
          </div>
        </section>`;
    }

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
            <div class="grow">
              <div class="push-title">${waiting.from} sent an update</div>
              <div class="push-sub">
                ${waiting.entries.length} thing${waiting.entries.length === 1 ? '' : 's'} to decide ·
                ${store.stamp(waiting.at)}
              </div>
            </div>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 24px">
          <div class="f11 soft lh145 mb14">
            Your copy has not changed. Take what you want from theirs; anything you keep is
            not asked about again. What you have bought, packed or written is not in here at
            all — it never leaves this phone.
          </div>

          ${waiting.entries.map((entry) => card(entry))}

          <div class="row g8 mt14">
            <button class="btn ghost grow" data-act="keep-all">Keep all of mine</button>
            <button class="btn ink grow" data-act="take-all">Take all of theirs</button>
          </div>
          <div class="f11 soft lh145 mt8">
            Either way this update is finished with, and the next one starts from where you
            leave it.
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-act="to-plan"]', () => { done = 0; go('plan'); });

    delegate(root, '[data-take]', (el) => {
      const waiting = store.pendingUpdate();
      const entry = waiting?.entries.find((e) => e.id === el.dataset.take);
      if (store.takeChange(entry)) done += 1;
      settle();
    });
    delegate(root, '[data-keep]', (el) => {
      const waiting = store.pendingUpdate();
      const entry = waiting?.entries.find((e) => e.id === el.dataset.keep);
      if (store.keepMine(entry)) done += 1;
      settle();
    });

    delegate(root, '[data-act="take-all"]', () => {
      const waiting = store.pendingUpdate();
      if (!waiting) return;
      for (const entry of waiting.entries) {
        if (store.takeChange(entry)) done += 1;
      }
      store.finishReview(waiting.version);
    });
    delegate(root, '[data-act="keep-all"]', () => {
      const waiting = store.pendingUpdate();
      if (!waiting) return;
      done += waiting.entries.length;
      store.finishReview(waiting.version);
    });
  },
};

/** Once the last one is decided, the update itself is finished with. */
function settle() {
  const left = store.pendingUpdate();
  if (!left) return;
  if (!left.entries.length) store.finishReview(left.version);
}

const VERBS = {
  added: { label: 'THEY ADDED', tone: 'jade' },
  changed: { label: 'THEY CHANGED', tone: 'amber' },
  removed: { label: 'THEY REMOVED', tone: 'rust' },
};

function card(entry) {
  const verb = VERBS[entry.verb] || VERBS.changed;
  const where = entry.kind === 'stop'
    ? `Day ${entry.dayNumber}`
    : (entry.noun || 'row').replace(/^./, (c) => c.toUpperCase());

  return html`
    <div class="card mb12" style="padding:12px 13px">
      <div class="row g8 center mb8">
        <span class="badge ${verb.tone}">${verb.label}</span>
        <span class="f11 soft grow">${where}</span>
      </div>
      <div class="f135 w700" style="color:var(--ink);line-height:1.25">${entry.title}</div>
      ${entry.detail ? html`<div class="f11 soft mt2">${entry.detail}</div>` : ''}

      <div class="sides mt10">
        <div class="side">
          <div class="side-k">YOURS</div>
          <div class="side-v">${entry.mineText}</div>
        </div>
        <div class="side theirs">
          <div class="side-k">THEIRS</div>
          <div class="side-v">${entry.theirsText}</div>
        </div>
      </div>

      <div class="row g8 mt10">
        <button class="btn ghost grow" data-keep="${entry.id}">Keep mine</button>
        <button class="btn jade grow" data-take="${entry.id}">Take theirs</button>
      </div>
    </div>`;
}
