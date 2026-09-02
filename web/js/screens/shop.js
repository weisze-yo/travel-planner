// Screen 2f — Shopping list, grouped by place. Estimates are optional; the
// real price is typed after ticking, and only ticked items count towards
// spend. Ticking stamps the date and unticking clears it. The footer breaks
// the spend down by payment method.

import { html, delegate, money, boundedNumber } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { checkbox } from './parts.js';
import { PAYMENTS, BADGES } from '../data.js';

let addOpen = false;

export default {
  id: 'shop',
  tab: 'shop',

  render() {
    const groups = store.shoppingGroups();
    const totals = store.spendTotals();
    const symbol = state.trip?.currencySymbol || '¥';

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row">
            <div class="grow">
              <div class="screen-title">Shopping list</div>
              <div class="screen-sub">${totals.total} items · ${groups.length} places</div>
            </div>
            <button class="btn sm ink" data-act="add-toggle">${addOpen ? 'Close' : '+ Add'}</button>
          </div>
        </div>

        <div class="scroll" style="padding:12px 16px 250px">
          ${addOpen ? addForm() : ''}
          ${groups.length ? groups.map((group) => groupCard(group, symbol)) : html`
            <div class="empty">Nothing on the list yet. Press + Add for anything you want to buy.</div>`}
        </div>

        <div class="footer-card">
          <div class="row end between g10">
            <div class="grow">
              <div class="eyebrow">ACTUAL SPEND</div>
              <div class="spend-v">
                ${money(totals.spent, symbol)}
                <span class="spend-est">/ ${money(totals.planned, symbol)} est.</span>
              </div>
            </div>
            <div class="right none">
              <div class="eyebrow">≈ ${state.trip?.homeCurrencyCode || 'RM'}</div>
              <div class="spend-rm">${totals.homeLabel}</div>
            </div>
          </div>
          <div class="progress mt8"><i style="width:${totals.percent}%"></i></div>
          <div class="f11 w650 soft mt6">${totals.bought} of ${totals.total} bought</div>
          <div class="eyebrow mt10" style="font-size:10px">BY PAYMENT METHOD</div>
          <div class="row g5 wrap mt6">
            ${PAYMENTS.map((p) => {
              const bucket = totals.byPayment[p.id];
              const used = bucket.count > 0;
              return html`
                <span class="chip ${used ? 'jade' : 'grey'}">${p.label} · ${bucket.count} × ${money(bucket.sum, symbol)}</span>`;
            })}
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="add-toggle"]', () => { addOpen = !addOpen; nudge(); });
    delegate(root, '[data-act="add-cancel"]', () => { addOpen = false; nudge(); });
    delegate(root, '[data-act="add-save"]', () => {
      const name = root.querySelector('#new-name')?.value.trim();
      if (!name) return;
      const estimate = root.querySelector('#new-est')?.value;
      store.addShoppingItem({
        name,
        placeLabel: root.querySelector('#new-place')?.value || '',
        estimate: estimate ? boundedNumber(estimate.replace(/[^0-9.]/g, '')) : null,
        payment: root.querySelector('[name="new-pay"]:checked')?.value || 'cash',
      });
      addOpen = false;
    });

    delegate(root, '[data-act="tick"]', (el) => store.toggleBought(el.dataset.id));
    delegate(root, '[data-act="pay"]', (el) => store.cyclePayment(el.dataset.id));

    // Commit on change, so a repaint cannot land mid-keystroke.
    root.querySelectorAll('[data-paid-for]').forEach((input) => {
      input.addEventListener('change', () => store.setPaid(input.dataset.paidFor, input.value));
    });
  },
};

function nudge() {
  store.selectDay(state.selectedDay);
}

function groupCard(group, symbol) {
  const badge = BADGES[group.badge];
  return html`
    <div class="card-list mb14">
      <div class="group-head">
        <div class="grow">
          <div class="group-place">${group.placeLabel}</div>
          ${group.when ? html`<div class="group-when">${group.when}</div>` : ''}
        </div>
        ${badge ? html`<span class="chip ${group.badge === 'lastChance' ? 'danger' : 'grey'}">${badge}</span>` : ''}
      </div>
      ${group.items.map((item) => row(item, symbol))}
    </div>`;
}

function row(item, symbol) {
  const payment = PAYMENTS.find((p) => p.id === item.payment) || PAYMENTS[0];
  return html`
    <div class="item">
      <div class="item-top">
        ${checkbox(item.bought, { act: 'tick', id: item.id })}
        <button class="grow" style="text-align:left" data-act="tick" data-id="${item.id}">
          <div class="item-name${item.bought ? ' done' : ''}">${item.name}</div>
          ${item.detail ? html`<div class="item-sub">${item.detail}</div>` : ''}
        </button>
        <div class="right none">
          <div class="item-est">${item.estimate ? money(item.estimate, symbol) : '—'}</div>
          <div class="item-est-cap">est.</div>
        </div>
      </div>

      <div class="item-second">
        <button class="pay-chip" data-act="pay" data-id="${item.id}">${payment.label}</button>
        ${item.bought ? html`
          <div class="paid-wrap">
            <span class="paid-cap">PAID</span>
            <input class="paid-input" data-paid-for="${item.id}" inputmode="decimal"
                   placeholder="What you paid" value="${item.paidAmount ?? ''}" aria-label="What you paid">
          </div>` : ''}
      </div>

      ${item.bought && item.boughtOn ? html`
        <div class="bought-line">Bought ${formatStamp(item.boughtOn)}</div>` : ''}
    </div>`;
}

function formatStamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function addForm() {
  return html`
    <div class="form mb14">
      <div class="form-title">Add an item</div>
      <input id="new-name" placeholder="What is it?">
      <select id="new-place">
        <option value="">Choose a place (main or sub route)</option>
        ${store.placeOptions().map((label) => html`<option value="${label}">${label}</option>`)}
      </select>
      <input id="new-est" placeholder="Estimated price (optional)" inputmode="decimal">
      <div class="row g5 wrap">
        ${PAYMENTS.map((p, i) => html`
          <label class="pill small" style="background:#fff;border:1px solid var(--field)">
            <input type="radio" name="new-pay" value="${p.id}"${i === 0 ? ' checked' : ''}
                   style="width:14px;height:14px;padding:0;margin:0;accent-color:#14201C">
            ${p.label}
          </label>`)}
      </div>
      <div class="form-actions">
        <button class="btn jade grow" data-act="add-save">Save</button>
        <button class="btn ghost" style="width:96px" data-act="add-cancel">Cancel</button>
      </div>
      <div class="form-hint">Estimated price is optional. The real price is entered after you tick the item, and only ticked items count towards spend.</div>
    </div>`;
}
