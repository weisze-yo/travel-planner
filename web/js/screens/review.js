// An update, one change at a time.
//
// This is where two copies of a trip meet. Somebody moved a stop, added a
// place, dropped a sub route; you have your own copy and may have changed
// the same things. Nothing has happened to your day yet and nothing will
// until you press Take on a row.
//
// So there is no conflict here, in the technical sense — only a list of
// differences with two sides shown and one decision each. What changed in
// this round is WHO the app says moved: with a retained base
// (`trip.reviewedSnapshot`) the diff is three-way, so a stop you added is no
// longer presented as one they removed, and the three cases that are really
// your own edits never reach the screen at all. Everything you take is
// written through the same mutations the Plan uses, so an accepted change is
// indistinguishable from one you made — and every decision is undoable for
// six seconds, from the bar the rest of the app already uses.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back, go } from '../nav.js';

/** Whether the collapsed receipt list is open. The only view state here. */
let showingDecided = false;

export default {
  id: 'review',
  tab: 'plan',

  render() {
    const waiting = store.pendingUpdate();
    if (waiting && !waiting.finished) return updateView(waiting);

    const receipt = store.lastReview();
    return receipt ? receiptView(receipt) : nothingView();
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-act="to-plan"]', () => { showingDecided = false; go('plan'); });
    delegate(root, '[data-act="show-decided"]', () => {
      showingDecided = !showingDecided;
      store.selectDay(state.selectedDay);
    });

    delegate(root, '[data-take]', (el) => {
      const waiting = store.pendingUpdate();
      const entry = waiting?.entries.find((e) => e.id === el.dataset.take);
      store.takeChange(entry);
      settle(waiting);
    });
    delegate(root, '[data-keep]', (el) => {
      const waiting = store.pendingUpdate();
      const entry = waiting?.entries.find((e) => e.id === el.dataset.keep);
      store.keepMine(entry);
      settle(waiting);
    });

    // Bulk. §6.2's rule is the whole reason bulk is allowed to exist: a bulk
    // action may never decide a row where both of you changed the same thing.
    delegate(root, '[data-act="keep-all"]', () => {
      const waiting = store.pendingUpdate();
      if (!waiting) return;
      const held = store.holdReview();
      for (const entry of waiting.entries) store.keepMine(entry, { quiet: true });
      store.rememberUndo('Kept all of yours', () => store.releaseReview(held));
      settle(waiting);
    });
    delegate(root, '[data-act="take-safe"]', () => {
      const waiting = store.pendingUpdate();
      if (!waiting) return;
      const safe = waiting.entries.filter((e) => e.stakes !== 'both');
      if (!safe.length) return;
      const held = store.holdReview();
      for (const entry of safe) store.takeChange(entry, { quiet: true });
      store.rememberUndo(`Took the ${safe.length} you have not touched`,
        () => store.releaseReview(held));
      settle(waiting);
    });
  },
};

/**
 * Once the last one is decided, the update itself is finished with — and the
 * decisions become the receipt rather than being discarded.
 *
 * `was` is read BEFORE the decision, because taking a change removes the
 * difference it was about: `pendingUpdate()` can legitimately go quiet the
 * moment the last row is taken, and the version and snapshot still have to
 * reach `finishReview` so the base and the receipt are written.
 */
function settle(was) {
  const left = store.pendingUpdate();
  if (!left || left.finished) {
    const src = left || was;
    if (src) store.finishReview(src.version, src.snapshot);
  }
}

// ------------------------------------------------------------- the states

/** 7.1 — nothing waiting and nothing ever reviewed. */
function nothingView() {
  return html`
    <section class="screen">
      ${head('Nothing to review', state.trip?.name || 'This trip')}
      <div class="scroll" style="padding:16px">
        <div class="empty">
          Their copy and yours say the same thing. An update appears here when somebody
          sends one.
        </div>
        <button class="btn jade wide mt14" data-act="to-plan">Back to the day</button>
      </div>
    </section>`;
}

/**
 * 7.4 / 7.5 — the receipt. It is rendered from `trip.lastReview`, so it
 * survives navigation and a relaunch, until a newer snapshot arrives. Today
 * you could decide seven things, leave, come back, and the screen would say
 * nothing had ever happened.
 */
function receiptView(receipt) {
  const rows = receipt.decisions || [];
  const took = rows.filter((r) => r.choice === 'took').length;
  const kept = rows.length - took;
  return html`
    <section class="screen">
      ${head('Nothing to review', state.trip?.name || 'This trip')}
      <div class="scroll" style="padding:14px 16px 24px">
        <div class="arrived">
          <div class="grow">
            <div class="arrived-t">UPDATE DEALT WITH</div>
            <div class="arrived-s">
              ${rows.length} thing${rows.length === 1 ? '' : 's'} decided — ${took} taken,
              ${kept} left as yours.
            </div>
            <div class="arrived-s">
              Your copy is yours again until the next update arrives.
            </div>
          </div>
        </div>

        ${rows.length ? html`<div class="card-list">${rows.map(receiptRow)}</div>` : ''}

        <button class="btn jade wide mt14" data-act="to-plan">Back to the day</button>
        <div class="f11 soft lh145 mt8" style="text-align:center">
          An update appears here when somebody sends one.
        </div>
      </div>
    </section>`;
}

function receiptRow(row, at) {
  return html`
    <div class="row g10 center${at ? ' row-divider' : ''}" style="padding:11px 14px">
      <span class="badge ${row.choice === 'took' ? 'jade' : ''}">
        ${row.choice === 'took' ? 'TAKEN' : 'KEPT'}
      </span>
      <div class="grow">
        <div class="f125 w650" style="color:var(--ink);line-height:1.3">${row.title}</div>
        <div class="f11 soft mt2">${row.outcome}</div>
      </div>
    </div>`;
}

/** 7.2 / 7.3 — an update, in progress or partly decided. */
function updateView(waiting) {
  const left = waiting.entries.length;
  const done = waiting.decided;
  const safe = waiting.entries.filter((e) => e.stakes !== 'both').length;
  const groups = groupByDay(waiting.entries);
  const decided = store.reviewedRows();

  return html`
    <section class="screen">
      ${head(
    `${waiting.from} sent an update`,
    `${waiting.total} thing${waiting.total === 1 ? '' : 's'}${
      done ? ` · ${done} decided` : ''} · ${store.stamp(waiting.at)}`,
  )}

      <div class="scroll" style="padding:14px 16px 20px">
        ${waiting.noBase ? html`
          <!-- §2.3 · bone, not amber and not rust: nothing is broken, the app
               simply does not know who moved. Said once, under the header. -->
          <div class="f11 lh145 mb12" style="color:var(--muted)">
            This update is being compared without a starting point, so both sides are shown
            as they are.
          </div>` : ''}

        ${groups.map((group) => html`
          <div class="review-group">
            <div class="eyebrow">${group.label}</div>
          </div>
          ${group.entries.map((entry) => card(entry, waiting.noBase))}`)}

        ${decided.length ? html`
          <button class="btn ghost wide mt8" data-act="show-decided">
            ${showingDecided
    ? `Hide the ${decided.length} you have decided`
    : `See the ${decided.length} you have decided`}
          </button>
          ${showingDecided ? html`
            <div class="card-list mt8">${decided.map(receiptRow)}</div>` : ''}` : ''}
      </div>

      <!-- §6.1 · the sticky foot. With six or seven entries the two bulk
           buttons used to sit roughly two screens below the fold, so the
           cheap way out of a long update was the hardest thing to find. -->
      <div class="review-foot">
        <div class="grow">
          <div class="f11 soft tnum">
            ${left} to decide${done ? ` · ${done} done` : ''}
          </div>
          ${safe === 0 && left > 0 ? html`
            <!-- The safety rule, said in the app's own voice at the moment
                 it applies. -->
            <div class="f11 soft lh145 mt2">
              ${left} left, and you have changed both. They go one at a time.
            </div>` : ''}
        </div>
      </div>
      <div class="review-foot" style="border-top:0;padding-top:0">
        <button class="btn ghost grow" data-act="keep-all">Keep all of mine</button>
        ${safe > 0 && !waiting.noBase ? html`
          <button class="btn ink grow" data-act="take-safe">
            Take the ${safe} you have not touched
          </button>` : ''}
      </div>
    </section>`;
}

function head(title, sub) {
  return html`
    <div class="head">
      <div class="head-row center">
        <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
        <div class="grow">
          <div class="push-title">${title}</div>
          <div class="push-sub">${sub}</div>
        </div>
      </div>
    </div>`;
}

/**
 * One `DAY 3 · 3 THINGS` eyebrow per day, replacing the `Day 3` chip repeated
 * on every card. Rows that are not stops group under the trip itself.
 */
function groupByDay(entries) {
  const byDay = new Map();
  for (const entry of entries) {
    const key = entry.kind === 'stop' ? entry.dayNumber : 'trip';
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(entry);
  }
  const days = [...byDay.keys()].filter((k) => k !== 'trip').sort((a, b) => a - b);
  const out = days.map((n) => ({
    label: `DAY ${n} · ${byDay.get(n).length} THING${byDay.get(n).length === 1 ? '' : 'S'}`,
    entries: byDay.get(n),
  }));
  if (byDay.has('trip')) {
    const rows = byDay.get('trip');
    out.push({
      label: `THIS TRIP · ${rows.length} THING${rows.length === 1 ? '' : 'S'}`,
      entries: rows,
    });
  }
  return out;
}

const VERBS = {
  added: { label: 'THEY ADDED', tone: 'jade' },
  changed: { label: 'THEY CHANGED', tone: '' },
  removed: { label: 'THEY REMOVED', tone: 'rust' },
};

/** The two buttons say what they do to YOUR day, not which side won. */
const BUTTONS = {
  added: { keep: 'Leave it out', take: 'Add it' },
  removed: { keep: 'Keep it', take: 'Remove it' },
  changed: { keep: 'Keep mine', take: 'Take theirs' },
};

function card(entry, noBase) {
  const verb = VERBS[entry.verb] || VERBS.changed;
  const words = BUTTONS[entry.verb] || BUTTONS.changed;
  const conflict = entry.stakes === 'both' && !noBase;

  return html`
    <div class="card mb12" style="padding:12px 13px">
      <div class="row g8 center mb8">
        <!-- In no-base mode the app genuinely does not know who moved, so it
             does not claim to: every changed row is THEY SENT. -->
        <span class="badge ${noBase && entry.verb === 'changed' ? '' : verb.tone}">
          ${noBase && entry.verb === 'changed' ? 'THEY SENT' : verb.label}
        </span>
        <span class="f11 soft grow">${entry.noun || ''}</span>
        ${conflict ? html`<span class="badge rust none">YOU CHANGED IT TOO</span>` : ''}
      </div>

      <!-- §4.1 · the title is the subject as YOU know it: the name in the
           base, else yours. Their new name appears exactly once, in the box
           that is labelled as theirs, which is the only place it is true. -->
      <div class="f135 w700" style="color:var(--ink);line-height:1.35">${entry.title}</div>
      ${entry.detail ? html`<div class="f11 soft mt2">${entry.detail}</div>` : ''}

      <div class="sides mt10">
        <div class="side stacked">
          <div class="side-k">YOURS</div>
          <div class="side-v"${entry.mineAbsent ? raw(' style="color:var(--faint)"') : ''}>${entry.mineText}</div>
        </div>
        <div class="side theirs stacked">
          <div class="side-k">THEIRS</div>
          <div class="side-v"${entry.theirsAbsent ? raw(' style="color:var(--jade-fg);font-weight:500"') : ''}>${entry.theirsText}</div>
        </div>
      </div>

      ${entry.delta ? html`
        <!-- Nobody should do arithmetic on two 12px numbers. -->
        <div class="row center mt8" style="justify-content:center">
          <span class="chip amber tnum">${entry.delta}</span>
        </div>` : ''}

      ${conflict && entry.cost ? html`
        <!-- §5.3 · the whole asymmetry treatment: the badge says you are
             involved, this line says what leaves. Keep mine gets no such
             line — nothing of theirs is lost by keeping yours. -->
        <div class="f115 w650 lh145 mt8" style="color:var(--danger-fg)">
          Takes theirs and drops your ${entry.cost}.
        </div>` : ''}

      <div class="row g8 mt10">
        <button class="btn ghost grow" data-keep="${entry.id}">${words.keep}</button>
        <button class="btn jade grow" data-take="${entry.id}">${words.take}</button>
      </div>
    </div>`;
}
