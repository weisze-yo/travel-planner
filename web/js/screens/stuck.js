// Changes on this phone — what is stuck, why, and the way out.
//
// Reached from the one strip that says so. The point of the screen is that
// it does not reassure: it names the reason, lists what would actually be
// lost, and offers a copy that is not on this phone, because "your changes
// are safe" is not something an app can promise when the cloud is refusing
// it.

import { html, raw, icon, delegate, money } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back } from '../nav.js';

let notice = '';
/**
 * Which control is doing async work — a key, never a free string (P0-5 R1).
 * `notice` keeps the outcomes it already carries: `Still 2 waiting.`,
 * `All sent.`, the save receipt, the discard confirmation.
 */
let pending = '';
let confirming = false;
let savedCopyAt = null;

export default {
  id: 'stuck',
  tab: null,

  render() {
    const sync = store.syncState();
    const groups = store.pendingSummary();
    const oldest = store.pendingOldest();
    const tries = store.pendingTries();

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.close)}</button>
            <div class="grow">
              <div class="push-title">Changes on this phone</div>
              <div class="push-sub">
                ${sync.count} waiting${oldest ? ` · oldest ${when(oldest)}` : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 24px">
          ${notice ? html`<div class="amber-note f12 mb12">${notice}</div>` : ''}

          ${sync.count ? html`
            <div class="stuck-why">
              <div class="f125 w800">Why they are stuck</div>
              <div class="f12 w650 lh15 mt4">${sync.reason || 'The cloud has not accepted them yet.'}</div>
              <button class="btn mt11" style="width:100%;height:42px;background:#9B4B4B;color:#fff"
                      data-act="retry"${pending === 'retry' ? raw(' disabled aria-busy="true"') : ''}>${
                        pending === 'retry' ? 'Trying…' : 'Try sending them now'}</button>
            </div>

            <div class="card-list mt12">
              <div class="pad16 eyebrow" style="padding-top:12px;padding-bottom:12px">WHAT WOULD BE LOST</div>
              ${groups.map((group) => html`
                <div class="row g12 row-divider" style="padding:12px 14px">
                  <div class="grow">
                    <div class="f13 w650">${group.count} ${store.syncKindName(group.kind, group.count)}</div>
                    <div class="f11 soft mt2">
                      ${group.labels.length ? group.labels.join(' · ') : 'edited on this phone'}
                    </div>
                  </div>
                  <div class="f11 w700 none" style="color:var(--danger-fg)">
                    ${span(group.from, group.to)}
                  </div>
                </div>`)}
            </div>
          ` : html`
            <div class="hint-jade">
              Nothing is waiting. Everything you have changed has reached the cloud.
            </div>`}

          <div class="card pad mt12">
            <div class="eyebrow">IF THE CLOUD CANNOT TAKE THEM NOW</div>
            <div class="f125 lh15 mt6" style="color:var(--charcoal)">
              Put a copy somewhere that is not this phone. The file holds the whole trip as it
              stands, and can be read back into the app later.
            </div>
            <div class="row g8 mt11">
              <button class="btn ink grow" style="height:42px" data-act="save-copy">Save a copy</button>
              <button class="btn ghost none" style="width:96px;height:42px" data-act="share-copy">Share</button>
            </div>
            <div class="f11 soft lh145 mt9">
              Last copy saved: ${savedCopyAt ? when(savedCopyAt) : 'never'}.
            </div>
          </div>

          ${sync.count ? html`
            <div class="card pad mt12">
              <div class="eyebrow">TRIED TO SEND</div>
              <div class="f125 lh15 mt6" style="color:var(--charcoal)">
                Every write is retried when the app is open and whenever signal comes back.
                ${tries} attempt${tries === 1 ? '' : 's'} so far${sync.reason ? ', all refused with the same reason' : ''}.
              </div>
              ${confirming ? html`
                <div class="col g8 mt12">
                  <div class="f125 w650" style="color:var(--danger-fg)">
                    This cannot be undone. The ${sync.count} change${sync.count === 1 ? '' : 's'}
                    above stay on this phone but will never be sent, and a fresh copy from
                    another device would overwrite them.
                  </div>
                  <div class="row g8">
                    <button class="btn grow" style="background:var(--danger-bg);color:var(--danger-fg)"
                            data-act="discard-confirm">Yes, stop trying</button>
                    <button class="btn ghost none" style="width:96px" data-act="discard-cancel">Cancel</button>
                  </div>
                </div>
              ` : html`
                <button class="f12 w700 mt10" style="color:var(--danger-fg)" data-act="discard">
                  Stop trying to send these…
                </button>`}
            </div>` : ''}
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => { notice = ''; pending = ''; confirming = false; back(); });

    delegate(root, '[data-act="retry"]', async () => {
      if (pending) return;
      pending = 'retry';
      notice = '';
      repaint();
      // Re-opening the trip replays every outstanding write through the same
      // path that queued it, which is the only honest way to retry.
      await store.boot(state.tripID);
      const after = store.syncState();
      pending = '';
      notice = after.count
        ? `Still ${after.count} waiting. ${after.reason || ''}`.trim()
        : 'All sent.';
      repaint();
    });

    delegate(root, '[data-act="save-copy"]', () => {
      download(`${slug(state.trip?.name)}-${stamp()}.json`);
      savedCopyAt = new Date().toISOString();
      notice = 'Saved. Keep it somewhere that is not this phone.';
      repaint();
    });

    delegate(root, '[data-act="share-copy"]', async () => {
      const text = store.tripSnapshot();
      const file = new File([text], `${slug(state.trip?.name)}.json`, { type: 'application/json' });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: state.trip?.name || 'Trip' });
          savedCopyAt = new Date().toISOString();
        } else {
          download(`${slug(state.trip?.name)}-${stamp()}.json`);
          savedCopyAt = new Date().toISOString();
          notice = 'This browser cannot share a file, so it was saved instead.';
        }
      } catch {
        // The share sheet was dismissed; nothing to report.
      }
      repaint();
    });

    delegate(root, '[data-act="discard"]', () => { confirming = true; repaint(); });
    delegate(root, '[data-act="discard-cancel"]', () => { confirming = false; repaint(); });
    delegate(root, '[data-act="discard-confirm"]', () => {
      store.discardPending();
      confirming = false;
      notice = 'Stopped. Those changes stay on this phone only.';
      repaint();
    });
  },
};

function download(name) {
  const blob = new Blob([store.tripSnapshot()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const slug = (name) => String(name || 'trip').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const stamp = () => new Date().toISOString().slice(0, 10);

function when(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function span(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return fmt(a) === fmt(b) ? fmt(a) : `${fmt(a)}–${fmt(b)}`;
}

function repaint() {
  store.selectDay(state.selectedDay);
}
