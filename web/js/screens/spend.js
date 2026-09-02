// The spend report, reached by tapping "Actual spend" on the Shop screen.
//
// One measure (money actually spent) across a handful of named buckets, so it
// is a single series: one hue, a direct label on every bar, and no legend to
// decode. The item table underneath is both the detail view and the
// non-colour way to read the same numbers.

import { html, raw, icon, delegate, money } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back } from '../nav.js';
import { SHOP_CATEGORIES, PAYMENTS } from '../data.js';

export default {
  id: 'spend',
  tab: 'shop',

  render() {
    const totals = store.spendTotals();
    const symbol = state.trip?.currencySymbol || '¥';
    const grouping = state.spendGroupBy;

    const buckets = grouping === 'payment'
      ? PAYMENTS.map((p) => ({ id: p.id, label: p.label, ...totals.byPayment[p.id] }))
      : SHOP_CATEGORIES.map((c) => ({ id: c.id, label: c.label, ...totals.byCategory[c.id] }));

    // Bars are scaled to the largest bucket, so the longest bar fills the track.
    const peak = Math.max(1, ...buckets.map((b) => b.sum));
    const spent = buckets.filter((b) => b.count > 0).sort((a, b) => b.sum - a.sum);
    const unused = buckets.filter((b) => b.count === 0);
    const items = store.filteredShopping().filter((i) => i.bought);

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
            <div class="grow">
              <div class="push-title">Actual spend</div>
              <div class="push-sub">${filterSummary()}</div>
            </div>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 32px">

          ${filters()}

          <div class="card pad mb12">
            <div class="eyebrow">SPENT SO FAR</div>
            <div class="row end g10 mt4">
              <div class="hero-figure grow">${money(totals.spent, symbol)}</div>
              <div class="right none">
                <div class="f11 w800 soft">≈ ${state.trip?.homeCurrencyCode || 'RM'}</div>
                <div class="f13 w700">${totals.homeLabel}</div>
              </div>
            </div>
            <div class="progress mt10"><i style="width:${totals.percent}%"></i></div>
            <div class="f115 muted mt6">
              ${money(totals.planned, symbol)} estimated · ${totals.bought} of ${totals.total} bought
              ${totals.spent > totals.planned && totals.planned > 0
                ? html` · <b style="color:var(--danger-fg)">${money(totals.spent - totals.planned, symbol)} over</b>`
                : ''}
            </div>
            <div class="f11 soft mt6">${store.rateLine()}</div>
          </div>

          <div class="card pad mb12">
            <div class="row g8 center mb10">
              <div class="eyebrow grow">BY ${grouping === 'payment' ? 'PAYMENT METHOD' : 'CATEGORY'}</div>
              <div class="row g5">
                ${[['category', 'Category'], ['payment', 'Payment']].map(([id, label]) => html`
                  <button class="cat${grouping === id ? ' on' : ''}" data-group="${id}">${label}</button>`)}
              </div>
            </div>

            ${spent.length ? html`
              <div class="bars">
                ${spent.map((bucket) => html`
                  <div class="bar-row">
                    <div class="bar-label">
                      <span class="grow">${bucket.label}</span>
                      <span class="bar-value">${money(bucket.sum, symbol)}</span>
                    </div>
                    <div class="bar-track">
                      <div class="bar-fill" style="width:${Math.max(2, (bucket.sum / peak) * 100)}%"></div>
                    </div>
                    <div class="bar-foot">
                      ${bucket.count} item${bucket.count === 1 ? '' : 's'} ·
                      ${Math.round((bucket.sum / Math.max(1, totals.spent)) * 100)}% of spend
                    </div>
                  </div>`)}
              </div>

              ${unused.length ? html`
                <div class="f11 soft mt10">
                  Nothing yet in ${unused.map((b) => b.label).join(', ')}.
                </div>` : ''}
            ` : html`
              <div class="empty" style="padding:18px 0">
                Nothing bought yet under this filter. Tick an item on the Shop
                screen and it appears here.
              </div>`}
          </div>

          <div class="card-list">
            <div class="row g8 center" style="padding:12px 14px">
              <div class="eyebrow grow">EVERY PURCHASE</div>
              <div class="f11 w700 soft">${items.length}</div>
            </div>
            ${items.length ? items.map((item) => html`
              <div class="essential">
                <div class="grow">
                  <div class="f13 w650">${item.name}</div>
                  <div class="f11 soft mt2">
                    ${item.placeLabel}${item.boughtOn ? ` · ${niceDate(item.boughtOn)}` : ''}
                  </div>
                  <div class="row g5 wrap mt6">
                    <span class="chip">${categoryLabel(item.category)}</span>
                    <span class="chip">${paymentLabel(item.payment)}</span>
                  </div>
                </div>
                <div class="right none">
                  <div class="f13 w700 tnum">${money(item.paidAmount ?? item.estimate ?? 0, symbol)}</div>
                  ${item.paidAmount == null
                    ? html`<div class="f11 soft mt2">estimate</div>`
                    : ''}
                </div>
              </div>`) : html`
              <div class="empty" style="padding:16px">No purchases under this filter.</div>`}
          </div>

          <div class="f11 soft lh145 mt12">
            Only ticked items count as spend. An item ticked without a real price
            counts at its estimate, and is marked as such above.
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-group]', (el) => store.setSpendGroupBy(el.dataset.group));
    delegate(root, '[data-day-filter]', (el) => store.setShopFilter({ day: el.dataset.dayFilter }));
    root.querySelector('#spend-place')?.addEventListener('change', (event) => {
      store.setShopFilter({ place: event.target.value });
    });
  },
};

/** "11 Mar" reads better than the stored ISO date. */
function niceDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const categoryLabel = (id) => SHOP_CATEGORIES.find((c) => c.id === id)?.label || 'Other';
const paymentLabel = (id) => PAYMENTS.find((p) => p.id === id)?.label || 'Cash';

function filterSummary() {
  const parts = [];
  parts.push(state.shopDay === 'all' ? 'All days' : `Day ${state.shopDay}`);
  if (state.shopPlace !== 'all') parts.push(state.shopPlace);
  return parts.join(' · ');
}

function filters() {
  const days = store.shopDayOptions();
  const places = store.shopPlaceOptions();
  return html`
    <div class="card pad mb12">
      <div class="eyebrow">FILTER</div>
      <div class="chiprow mt8">
        <button class="cat${state.shopDay === 'all' ? ' on' : ''}" data-day-filter="all">All days</button>
        ${days.map((n) => html`
          <button class="cat${String(state.shopDay) === String(n) ? ' on' : ''}" data-day-filter="${n}">
            Day ${n}
          </button>`)}
      </div>
      <select id="spend-place" class="mt8" style="width:100%">
        <option value="all"${state.shopPlace === 'all' ? ' selected' : ''}>Everywhere</option>
        ${places.map((label) => html`
          <option value="${label}"${state.shopPlace === label ? ' selected' : ''}>${label}</option>`)}
      </select>
    </div>`;
}
