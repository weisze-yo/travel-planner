// Everything that has changed, for when the banner is not enough.
//
// The whole feed, newest first, grouped by the day it is about. Your own
// edits are in here too — the banner hides them because you already know,
// but a record that quietly omitted half the edits would be worse than no
// record. There is nothing to decide on this screen: whoever edited last
// won, and the fix for a wrong time is to change it back.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back, go } from '../nav.js';

export default {
  id: 'changes',
  tab: 'plan',

  render() {
    const all = [...store.shareChanges()].reverse();
    const days = [...new Set(all.map((c) => c.dayNumber))].sort((a, b) => a - b);
    const meID = store.me().id;

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
            <div class="grow">
              <div class="push-title">Everything that’s changed</div>
              <div class="push-sub">
                ${all.length ? `${all.length} change${all.length === 1 ? '' : 's'} on this trip` : 'Nothing yet'}
              </div>
            </div>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 24px">
          ${all.length ? days.map((n) => html`
            <div class="eyebrow mb8">Day ${n}</div>
            <div class="card mb14" style="padding:11px 13px">
              ${all.filter((c) => c.dayNumber === n).map((c) => html`
                <div class="moved-l" style="margin-bottom:8px">
                  <span class="moved-w">${c.who === meID ? 'You' : (c.byName || 'Someone')}</span>
                  <span class="grow">
                    ${c.verb} ${c.what}
                    ${c.was ? html`<span class="mark-was block">was ${c.was}</span>` : ''}
                  </span>
                  <span class="f11 soft tnum">${store.stamp(c.at)}</span>
                </div>`)}
            </div>
            <button class="btn ghost mb18" style="width:100%" data-open-day="${n}">Open Day ${n}</button>
          `) : html`
            <div class="empty">
              Nothing has changed since this trip was shared. Times, stops and order all
              reach everyone; nothing about what you have bought, packed or written does.
            </div>`}
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-open-day]', (el) => {
      store.selectDay(Number(el.dataset.openDay));
      store.catchUp(Number(el.dataset.openDay));
      go('plan');
    });
  },
};
