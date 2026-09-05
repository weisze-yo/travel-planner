// The spend report, reached by tapping "Actual spend" on the Shop screen.
//
// It leads with the shape of the trip rather than a total, because the two
// questions you actually ask when you get home are how the money moved
// across the days and how close your estimates were. A total and a category
// bar answer neither.
//
// The day chart is the filter: tapping a day narrows everything below it, so
// there is one control rather than a row of pills.

import { html, raw, icon, delegate, money } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back } from '../nav.js';
import { SHOP_CATEGORIES, PAYMENTS } from '../data.js';

export default {
  id: 'spend',
  tab: 'shop',

  render() {
    const symbol = state.trip?.currencySymbol || '';
    const only = state.spendDay;
    const days = store.spendByDay();
    const totals = store.spendTotals({ all: true });
    const accuracy = store.spendAccuracy();

    const groups = store.purchasesByDay().filter((g) => !only || g.dayNumber === only);
    const shown = groups.reduce((n, g) => n + g.items.length, 0);
    const spent = only
      ? (days.rows.find((r) => r.dayNumber === only)?.sum || 0)
      : totals.spent;

    const dayCount = state.trip?.dayCount || 1;
    const perDay = dayCount ? Math.round(totals.spent / dayCount) : 0;
    const underBy = accuracy.estimated ? Math.round((accuracy.difference / accuracy.estimated) * 100) : 0;

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row center">
            <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
            <div class="grow">
              <div class="push-title">Actual spend</div>
              <div class="push-sub">
                ${state.trip?.name?.split(' · ')[0] || 'This trip'} ·
                ${only ? `day ${only} only` : `all ${dayCount} days`}
              </div>
            </div>
            <div class="f14 w700 tnum none">${money(spent, symbol)}</div>
          </div>
        </div>

        <div class="scroll" style="padding:14px 16px 32px">

          <div class="spend-hero">
            <div class="row g10" style="align-items:flex-start">
              <div class="grow">
                <div class="eyebrow" style="color:#8FB3A6">
                  SPENT IN ${only ? `DAY ${only}` : `${dayCount} DAY${dayCount === 1 ? '' : 'S'}`}
                </div>
                <div class="spend-big">${money(spent, symbol)}</div>
              </div>
              <!-- §7.2: no rate, no conversion row. It used to divide by 1
                   and print the same figure again beside a currency code it
                   had never been converted into. -->
              ${state.trip?.homeCurrencyRate ? html`
                <div class="right none">
                  <div class="f11 w800" style="color:#8FB3A6">≈ ${state.trip?.homeCurrencyCode || 'RM'}</div>
                  <div class="f17 w700 tnum">
                    ${Math.round(spent / state.trip.homeCurrencyRate).toLocaleString('en-US')}
                  </div>
                  <div class="f10 mt2" style="color:#8FB3A6">at ${state.trip.homeCurrencyRate}</div>
                </div>` : ''}
            </div>
            <div class="row g6 wrap mt14">
              ${!only ? html`<span class="hero-chip">${money(perDay, symbol)} a day</span>` : ''}
              <span class="hero-chip">${totals.bought} purchase${totals.bought === 1 ? '' : 's'}</span>
              ${accuracy.estimated ? html`
                <span class="hero-chip ${accuracy.difference >= 0 ? 'good' : 'bad'}">
                  ${Math.abs(underBy)}% ${accuracy.difference >= 0 ? 'under' : 'over'} plan
                </span>` : ''}
            </div>
          </div>

          ${!symbol ? html`
            <!-- §7.1: one of exactly two places that SUMMARISE money, so one
                 of exactly two that explain a bare number. Under the ink
                 hero, not inside it — --amber-fg is a light-surface colour
                 and this design adds none. -->
            <div class="f11 w650 lh145 mt10" style="color:var(--amber-fg)">
              Prices have no currency yet. Set it in Trip settings.
            </div>` : ''}

          ${dayChart(days, symbol)}

          ${whereItWent(symbol)}

          ${accuracy.total ? guessedAgainstPaid(accuracy, symbol) : ''}

          ${cashAndCard(symbol)}

          ${everyPurchase(groups, shown, symbol)}
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => { store.setSpendDay(null); back(); });
    delegate(root, '[data-group]', (el) => store.setSpendGroupBy(el.dataset.group));
    delegate(root, '[data-spend-day]', (el) => store.setSpendDay(Number(el.dataset.spendDay)));
    delegate(root, '[data-act="all-days"]', () => store.setSpendDay(null));
  },
};

/** How the money moved across the days — and the filter for everything below. */
function dayChart(days, symbol) {
  const only = state.spendDay;
  const biggest = days.biggest;
  return html`
    <div class="card pad mt12">
      <div class="row g8" style="align-items:baseline">
        <div class="grow eyebrow">DAY BY DAY</div>
        ${only
          ? html`<button class="f11 w700" style="color:var(--jade)" data-act="all-days">Show all days</button>`
          : (biggest ? html`<div class="f11 w700 muted">Biggest: Day ${biggest.dayNumber}</div>` : '')}
      </div>

      <div class="daybars mt14">
        ${days.rows.map((row) => {
          const on = only === row.dayNumber;
          const top = only ? on : row.dayNumber === biggest?.dayNumber;
          const height = Math.max(row.sum ? 4 : 1, Math.round((row.sum / days.peak) * 100));
          return html`
            <button class="daybar" data-spend-day="${row.dayNumber}"
                    aria-label="Day ${row.dayNumber}, ${money(row.sum, symbol)}"
                    aria-pressed="${on ? 'true' : 'false'}">
              <div class="daybar-v${top ? ' on' : ''}">${row.sum ? short(row.sum) : ''}</div>
              <div class="daybar-fill${top ? ' on' : ''}" style="height:${height}%"></div>
            </button>`;
        })}
      </div>
      <div class="daylabels">
        ${days.rows.map((row) => html`
          <div class="daylabel${only === row.dayNumber || (!only && row.dayNumber === biggest?.dayNumber) ? ' on' : ''}">
            D${row.dayNumber}
          </div>`)}
      </div>
      <div class="f115 muted lh145 mt10">
        ${only
          ? `Showing day ${only} only. Tap it again, or "Show all days", to go back.`
          : 'Tap a day to filter everything below.'}
      </div>
    </div>`;
}

/** Where it went, by category or by payment method. */
function whereItWent(symbol) {
  const grouping = state.spendGroupBy;
  const source = store.purchasesByDay()
    .filter((g) => !state.spendDay || g.dayNumber === state.spendDay)
    .flatMap((g) => g.items);

  const keys = grouping === 'payment' ? PAYMENTS : SHOP_CATEGORIES;
  const buckets = keys.map((k) => ({
    id: k.id,
    label: k.label,
    sum: source
      .filter((i) => (grouping === 'payment' ? i.payment : i.category) === k.id)
      .reduce((n, i) => n + (i.paidAmount ?? i.estimate ?? 0), 0),
  })).filter((b) => b.sum > 0).sort((a, b) => b.sum - a.sum);

  const total = buckets.reduce((n, b) => n + b.sum, 0) || 1;
  const swatch = ['#1F6F5C', '#C87F0A', '#3D4C46', '#B9C6C0', '#8FB3A6'];

  return html`
    <div class="card pad mt12">
      <div class="row g8 center">
        <div class="grow eyebrow">WHERE IT WENT</div>
        <div class="row g5">
          ${[['category', 'Category'], ['payment', 'Payment']].map(([id, l]) => html`
            <button class="cat${grouping === id ? ' on' : ''}" data-group="${id}">${l}</button>`)}
        </div>
      </div>

      ${buckets.length ? html`
        <div class="stack mt12">
          ${buckets.map((b, i) => html`
            <div style="width:${(b.sum / total) * 100}%;background:${swatch[i % swatch.length]}"></div>`)}
        </div>
        <div class="col g9 mt12">
          ${buckets.map((b, i) => html`
            <div class="row g9 center">
              <span class="key" style="background:${swatch[i % swatch.length]}"></span>
              <span class="grow f13 w650">${b.label}</span>
              <span class="f11 w700 soft">${Math.round((b.sum / total) * 100)}%</span>
              <span class="f13 w700 tnum right" style="width:70px">${money(b.sum, symbol)}</span>
            </div>`)}
        </div>
      ` : html`<div class="empty" style="padding:14px">Nothing bought here yet.</div>`}
    </div>`;
}

/** What you guessed against what you paid. */
function guessedAgainstPaid(a, symbol) {
  return html`
    <div class="card pad mt12">
      <div class="eyebrow">WHAT YOU GUESSED, WHAT YOU PAID</div>

      <div class="row g10 mt10" style="align-items:baseline">
        <div class="f22 w700 tnum">${money(a.estimated, symbol)}</div>
        <div class="f12 w650 soft">estimated</div>
      </div>
      <div class="acc-track mt8"><i style="width:${(a.estimated / a.peak) * 100}%;background:#DCE3DE"></i></div>

      <div class="row g10 mt12" style="align-items:baseline">
        <div class="f22 w700 tnum">${money(a.paid, symbol)}</div>
        <div class="f12 w700" style="color:var(--jade)">paid</div>
      </div>
      <div class="acc-track mt8"><i style="width:${(a.paid / a.peak) * 100}%;background:var(--jade)"></i></div>

      <div class="f115 muted lh145 mt11">
        ${a.difference === 0
          ? 'Bang on the estimates.'
          : `${money(Math.abs(a.difference), symbol)} ${a.difference > 0 ? 'under' : 'over'}.`}
        ${a.under ? `The ${a.under.name.toLowerCase()} came in ${money(a.under.gap, symbol)} cheaper than expected` : ''}${a.under && a.over ? '; ' : (a.under ? '.' : '')}
        ${a.over ? `the ${a.over.name.toLowerCase()} was ${money(a.over.gap, symbol)} over.` : ''}
        ${a.noEstimate
          ? ` ${a.noEstimate} of ${a.total} items had no estimate, so they only count on the paid side.`
          : ''}
      </div>
    </div>`;
}

/** The payment split, which is a question of its own rather than a grouping. */
function cashAndCard(symbol) {
  const source = store.purchasesByDay()
    .filter((g) => !state.spendDay || g.dayNumber === state.spendDay)
    .flatMap((g) => g.items);
  const rows = PAYMENTS.map((p) => ({
    label: p.label,
    sum: source.filter((i) => i.payment === p.id).reduce((n, i) => n + (i.paidAmount ?? i.estimate ?? 0), 0),
  })).filter((r) => r.sum > 0);
  if (rows.length < 2) return '';

  const total = rows.reduce((n, r) => n + r.sum, 0) || 1;
  const swatch = ['#1F6F5C', '#C87F0A', '#3D4C46', '#B9C6C0'];

  return html`
    <div class="card pad mt12">
      <div class="eyebrow">HOW YOU PAID</div>
      <div class="stack mt11">
        ${rows.map((r, i) => html`
          <div style="width:${(r.sum / total) * 100}%;background:${swatch[i % swatch.length]}"></div>`)}
      </div>
      <div class="row g14 mt11">
        ${rows.map((r, i) => html`
          <div class="grow">
            <div class="row g7 center">
              <span class="key" style="background:${swatch[i % swatch.length]}"></span>
              <span class="f12 w650">${r.label}</span>
            </div>
            <div class="f15 w700 tnum mt2">${money(r.sum, symbol)}</div>
          </div>`)}
      </div>
    </div>`;
}

/** Every purchase, grouped by the day it happened on. */
function everyPurchase(groups, shown, symbol) {
  return html`
    <div class="card-list mt12">
      <div class="row g8 center" style="padding:12px 14px">
        <div class="grow eyebrow">EVERY PURCHASE</div>
        <div class="f11 w700 soft">${shown}</div>
      </div>

      ${groups.length
        ? groups.map((group) => purchaseGroup(group, symbol))
        : html`<div class="empty" style="padding:16px">Nothing ticked yet.</div>`}
    </div>

    <div class="f11 soft lh145 mt12">
      Only ticked items count. An item ticked without a real price counts at its estimate and
      is marked here.
    </div>`;
}

function purchaseGroup(group, symbol) {
  return html`
    <div class="purchase-day">
      <div class="grow f11 w800 muted">
        DAY ${group.dayNumber}${group.dateLabel ? ` · ${group.dateLabel.toUpperCase()}` : ''}
      </div>
      <div class="f11 w800 muted tnum">${money(group.sum, symbol)}</div>
    </div>
    ${group.items.map((item) => purchaseRow(item, symbol))}`;
}

function purchaseRow(item, symbol) {
  const paid = item.paidAmount ?? item.estimate ?? 0;
  const gap = item.paidAmount != null && item.estimate != null ? item.paidAmount - item.estimate : null;
  const payment = (PAYMENTS.find((p) => p.id === item.payment) || {}).label || item.payment;

  return html`
    <div class="row g12 row-divider" style="padding:12px 14px">
      <div class="grow">
        <div class="f13 w650">${item.name}</div>
        <div class="f11 soft mt2">
          ${item.placeLabel || 'somewhere'}${item.boughtAt ? ` · ${item.boughtAt}` : ''}
        </div>
        <div class="row g5 wrap mt6">
          <span class="chip">${store.categoryLabel(item.category)}</span>
          <span class="chip">${payment}</span>
        </div>
      </div>
      <div class="right none">
        <div class="f13 w700 tnum">${money(paid, symbol)}</div>
        ${gapLine(gap, symbol)}
      </div>
    </div>`;
}

/** Whether the real price beat the guess — the reason to keep estimates at all. */
function gapLine(gap, symbol) {
  if (gap == null) return html`<div class="f105 soft mt2">estimate</div>`;
  if (gap === 0) return html`<div class="f105 soft mt2">as guessed</div>`;
  return html`
    <div class="f105 w700 mt2" style="color:${gap > 0 ? 'var(--danger-fg)' : 'var(--jade)'}">
      ${money(Math.abs(gap), symbol)} ${gap > 0 ? 'over' : 'under'}
    </div>`;
}

/** "64.2k" — the chart has no room for the whole figure. */
function short(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 1 : 1)}k`;
  return String(Math.round(n));
}
