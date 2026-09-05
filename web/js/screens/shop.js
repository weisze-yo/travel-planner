// Screen 2f — Shopping list, grouped by place. Estimates are optional; the
// real price is typed after ticking, and only ticked items count towards
// spend. Ticking stamps the date and unticking clears it. The footer breaks
// the spend down by payment method.

import { html, raw, icon, delegate, money, boundedNumber } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { checkbox, itemEditor, readItemEditor } from './parts.js';
import { PAYMENTS, BADGES, SHOP_CATEGORIES } from '../data.js';
import { swipeToDelete } from './parts.js';
import { go } from '../nav.js';

let addOpen = false;
/** The item whose correction sheet is open, if any. */
let editing = null;
/**
 * The item editor's refusal, when the name has been emptied. Same rule and
 * same sentence as Destination's copy of this sheet — it is one editor, so it
 * refuses the same way wherever it is opened (`p1-destination-tabs-design.md` §6).
 */
let editError = '';

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

        <div class="head" style="padding-top:0;border-bottom:1px solid var(--line)${groups.length ? '' : ';opacity:.45'}">
          <div class="chiprow">
            <button class="cat${state.shopDay === 'all' ? ' on' : ''}" data-day-filter="all">All days</button>
            ${store.shopDayOptions().map((n) => html`
              <button class="cat${String(state.shopDay) === String(n) ? ' on' : ''}" data-day-filter="${n}">
                Day ${n}
              </button>`)}
          </div>
          <div class="chiprow mt6">
            <button class="cat${state.shopPlace === 'all' ? ' on' : ''}" data-place-filter="all">Everywhere</button>
            ${store.shopPlaceOptions().map((label) => html`
              <button class="cat${state.shopPlace === label ? ' on' : ''}" data-place-filter="${label}">
                ${label}
              </button>`)}
          </div>
        </div>

        <div class="scroll" style="padding:12px 16px ${groups.length ? '250px' : '24px'}">
          ${addOpen ? addForm() : ''}
          ${groups.length ? groups.map((group) => groupCard(group, symbol)) : html`
            <div class="empty-t1">
              <div class="empty-t1-mark-row"></div>
              <div class="empty-t1-title">Nothing on the list yet</div>
              <div class="empty-t1-body">
                Add anything you want to buy, priced or not — the estimate is what your spend
                gets measured against later.
              </div>
              <div class="col g8 mt14" style="width:100%">
                <button class="btn ink" data-act="add-toggle">+ Add</button>
              </div>
            </div>`}
        </div>

        ${editing ? itemEditor(state.shopping.find((i) => i.id === editing), { symbol, error: editError }) : ''}

        ${groups.length ? html`
          <button class="footer-card" data-act="report" aria-label="Open the spend report">
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
            <div class="row g8 center mt6">
              <div class="grow f11 w650 soft">${totals.bought} of ${totals.total} bought</div>
              <div class="f11 w700" style="color:var(--jade)">See the report ›</div>
            </div>
          </button>` : ''}
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
        category: root.querySelector('#new-cat')?.value || 'other',
      });
      addOpen = false;
    });

    delegate(root, '[data-act="tick"]', (el) => store.toggleBought(el.dataset.id));

    delegate(root, '[data-edit-item]', (el) => { editing = el.dataset.editItem; editError = ''; nudge(); });
    delegate(root, '[data-act="item-cancel"]', () => { editing = null; editError = ''; nudge(); });
    delegate(root, '[data-act="item-save"]', () => {
      const patch = readItemEditor(root);
      if (!patch) {
        editError = 'What is it? One word is enough.';
        nudge();
        root.querySelector('#edit-name')?.focus();
        return;
      }
      editError = '';
      store.updateShoppingItem(editing, patch);
      editing = null;
    });
    root.querySelectorAll('[data-pay-for]').forEach((select) => {
      select.addEventListener('change', () => store.setPayment(select.dataset.payFor, select.value));
    });
    root.querySelectorAll('[data-cat-for]').forEach((select) => {
      select.addEventListener('change', () => store.setShoppingCategory(select.dataset.catFor, select.value));
    });

    delegate(root, '[data-day-filter]', (el) => store.setShopFilter({ day: el.dataset.dayFilter }));
    delegate(root, '[data-place-filter]', (el) => store.setShopFilter({ place: el.dataset.placeFilter }));
    delegate(root, '[data-act="report"]', () => go('spend'));

    swipeToDelete(root, {
      rowSelector: '[data-shop-row]',
      name: (row) => row.dataset.shopName,
      label: () => 'Off the list for good',
      onDelete: (row) => store.deleteShoppingItem(row.dataset.shopRow),
    });

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
  return html`
    <div class="swipe-row swipe-flat" data-shop-row="${item.id}" data-shop-name="${item.name}">
      <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete ${item.name}">${raw(icon.bin)}</button></div>
      <div class="swipe-face item">
      <div class="item-top">
        ${checkbox(item.bought, { act: 'tick', id: item.id })}
        <button class="grow" style="text-align:left" data-edit-item="${item.id}"
                aria-label="Correct ${item.name}">
          <div class="item-name${item.bought ? ' done' : ''}">
            ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}
          </div>
          ${item.detail ? html`<div class="item-sub">${item.detail}</div>` : ''}
        </button>
        <div class="right none">
          <div class="item-est">${item.estimate ? money(item.estimate, symbol) : '—'}</div>
          <div class="item-est-cap">est.</div>
        </div>
      </div>

      <div class="item-second">
        <label class="pay-chip">
          <select data-pay-for="${item.id}" aria-label="Payment method for ${item.name}">
            ${PAYMENTS.map((p) => html`
              <option value="${p.id}"${p.id === item.payment ? ' selected' : ''}>${p.label}</option>`)}
          </select>
        </label>
        <label class="pay-chip">
          <select data-cat-for="${item.id}" aria-label="Category for ${item.name}">
            ${SHOP_CATEGORIES.map((c) => html`
              <option value="${c.id}"${c.id === (item.category || 'other') ? ' selected' : ''}>${c.label}</option>`)}
          </select>
        </label>
        ${item.bought ? html`
          <div class="paid-wrap">
            <span class="paid-cap">PAID</span>
            <input class="paid-input" data-paid-for="${item.id}" inputmode="decimal"
                   placeholder="What you paid" value="${item.paidAmount ?? ''}" aria-label="What you paid">
          </div>` : ''}
      </div>

        ${item.bought && item.boughtOn ? html`
          <div class="bought-line">Bought ${formatStamp(item.boughtOn)}</div>` : ''}
      </div>
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
      <select id="new-cat">
        ${SHOP_CATEGORIES.map((c) => html`<option value="${c.id}">${c.label}</option>`)}
      </select>
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
