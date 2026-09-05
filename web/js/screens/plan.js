// Screen 2b — Plan. The day as one column: white cards on a jade spine for
// the agent's stops, and between them dashed amber lanes where free time
// lives.
//
// Three decisions from the artboards are load-bearing here.
//
// A stop holds *two* times. The alternative was a start plus a length, and
// it lost because a sub route's deadline is a clock time — 15:45 at the
// coach door — which a length turns into arithmetic you redo in your head
// every edit. So both times are inputs and the length is derived grey text.
//
// Free time is a slot, not a stop. Every gap draws a lane; a sub route lives
// inside one; a day holds as many as it has gaps. Nothing about a sub route
// is a row on the itinerary any more.
//
// And the drag always lands. A row that is now wrong wears a strip naming
// what is wrong and the one tap that fixes it.
//
// On a shared trip one more thing lives here: a line saying an update is
// waiting, which opens the review screen. It never changes the day on its
// own — nothing does but you.

import { html, raw, esc, icon, delegate, parseClock, clock } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go } from '../nav.js';
import { dayPills, weatherBanner, bindDragReorder, swipeToDelete, emptyShared } from './parts.js';

let addOpen = false;
let form = { name: '', start: '', end: '', kind: 'main' };
let notice = '';
/**
 * Which control is doing async work — a key, never a free string (P0-5 R1).
 * `notice` keeps the outcomes it already carries, including the "added
 * without a location" caveat, which is a real outcome and stays (R4).
 */
let pending = '';
/**
 * The add-a-stop form's one required field, when it has refused. The rust
 * field hint, in the field — never a pre-disabled primary
 * (`p1-destination-tabs-design.md` §6.2, `p1-plan-editing-design.md` §7.3).
 */
let addError = '';
/**
 * N-9 · where a removed stop just went, so the tap has a receipt.
 * `{ id, name, to }`, screen-local and transient.
 *
 * It is held here rather than on the item because `movePlanItemToDay` really
 * does relocate the row — the card it would print into has left this day by
 * the time the receipt is due. `movedToDay` on the item stays what it was
 * (set to null in three places, read by nothing); it is recorded as still
 * unused rather than pressed into a job it cannot do.
 */
let moved = null;
/**
 * N-8 · rows whose last time commit could not be read, by id and edge. The
 * `.edge-derived` slot holds a derived value that is meaningless while a time
 * is invalid, so it carries the reason instead — replacing a value rather
 * than adding a line, so no row changes height and nothing below it moves.
 */
let badTime = {};
/** The lane whose "new sub route" sheet is open, if any. */
let laneSheet = null;
/** "Later" holds the update banner off until the screen is left. */
let later = false;

export default {
  id: 'plan',
  tab: 'plan',

  render() {
    const day = store.day();
    const rows = store.dayTimeline();
    const archived = store.archivedItems(day);
    const editing = state.editingPlan;
    const numbers = store.mainStopNumbers(day);
    const issues = store.dayIssues();
    const stops = rows.filter((r) => r.kind === 'stop');
    const waiting = store.pendingUpdate();

    if (laneSheet) return laneForm(day, issues);

    return html`
      <section class="screen">
        <div class="head">
          <div class="head-row">
            <div class="grow">
              <div class="screen-title">Day ${day?.dayNumber ?? ''}</div>
              <div class="screen-sub">
                ${day?.dateLabel || ''}${stops.length ? '' : ' · nothing planned'}
                ${issues.size ? raw(`· <b class="look-at">${issues.size} thing${issues.size === 1 ? '' : 's'} to look at</b>`) : ''}
              </div>
            </div>
            <button class="iconbtn filled" data-act="toggle-edit"
                    style="${editing ? 'background:var(--jade)' : ''}"
                    aria-label="${editing ? 'Finish editing' : 'Edit this day'}"
                    aria-pressed="${editing ? 'true' : 'false'}">
              ${raw(editing ? icon.tick('#fff', 15) : icon.pencil('#14201C', 17))}
            </button>
          </div>
          <div class="chiprow mt10">${dayPills({ small: true })}</div>
        </div>

        <div class="scroll" style="padding:14px 16px 24px">
          ${weatherBanner()}

          ${waiting && !later ? updateBanner(waiting) : ''}

          ${editing ? html`
            <div class="hint-amber mt14">
              Drag by the handle. Both times are yours to set — the length follows.
            </div>` : ''}

          ${stops.length ? html`
            <div class="mt14" id="plan-rows">
              ${rows.map((row, index) => (row.kind === 'stop'
                ? stopRow(row, {
                    editing,
                    number: numbers[row.item.id],
                    last: index === rows.length - 1,
                    issues: issues.get(row.item.id) || [],
                  })
                : laneRow(row, { editing, last: index === rows.length - 1 })))}
            </div>` : (store.isSharedEmptyKind('days') ? sharedEmptyDay(day) : emptyDay())}

          ${editing ? html`
            ${notice ? html`<div class="amber-note f12 mt8">${notice}</div>` : ''}
            ${addOpen ? addForm() : ''}
            <button class="btn-dashed mt8" data-act="add-open">+ Add a stop</button>
            <button class="btn ghost mt8" style="width:100%" data-act="paste">Paste an itinerary</button>
          ` : ''}

          <!-- The block also renders for a bare receipt: moving the last
               archived stop away empties the archived list, and the receipt
               for that very move would go with it. -->
          ${archived.length || moved ? archive(archived, editing) : ''}
        </div>
      </section>`;
  },

  mount(root) {
    if (laneSheet) {
      mountLaneForm(root);
      return;
    }

    delegate(root, '[data-day]', (el) => {
      // A receipt about day 3 has no business on day 4, and a stale invalid
      // time from another day would render `not a time` against a row that
      // never refused anything.
      moved = null;
      badTime = {};
      store.selectDay(Number(el.dataset.day));
    });
    delegate(root, '[data-act="toggle-edit"]', () => {
      addOpen = false;
      store.setEditingPlan(!state.editingPlan);
    });
    delegate(root, '[data-open]', (el) => {
      // Edit mode owns live rows — drag, retime, remove — but an archived row
      // is only ever a link.
      const archivedRow = el.closest('[data-plan-row]');
      if (state.editingPlan && !archivedRow) return;
      go('dest', { itemID: el.dataset.open });
    });
    delegate(root, '[data-open-loop]', (el) => {
      store.selectLoop(el.dataset.openLoop);
      go('sub', { loopID: el.dataset.openLoop });
    });
    delegate(root, '[data-act="remove"]', (el) => {
      moved = null;
      store.archivePlanItem(state.selectedDay, el.dataset.id);
    });
    delegate(root, '[data-act="restore"]', (el) => {
      moved = null;
      store.restorePlanItem(state.selectedDay, el.dataset.id);
    });
    delegate(root, '[data-act="move-day"]', (el) => {
      const to = Number(el.dataset.to);
      const hit = store.planItem(el.dataset.id);
      moved = { id: el.dataset.id, name: hit?.item.name || 'That stop', to };
      store.movePlanItemToDay(state.selectedDay, el.dataset.id, to);
    });

    // Both times commit on change (i.e. as focus leaves) so a re-render
    // cannot interrupt typing. An emptied end field is a real edit.
    root.querySelectorAll('[data-time-for]').forEach((input) => {
      input.addEventListener('change', () => {
        const text = input.value.trim();
        const which = input.dataset.edge;
        const hit = store.planItem(input.dataset.timeFor);

        if (which === 'end' && (text === '' || text === '—')) {
          store.setPlanItemWindow(state.selectedDay, input.dataset.timeFor, { end: null });
          return;
        }
        if (parseClock(text) == null) {
          // The input still reverts — the stored value is the one that was
          // readable — but the row now says WHY, in the gutter, for this row
          // only. Not the .amber-note slot at the top of the scroller: that
          // is for outcomes, and a typo is not an outcome.
          input.value = which === 'end' ? (hit?.item.endTime || '') : (hit?.item.time || '');
          badTime = { ...badTime, [input.dataset.timeFor]: which };
          store.setEditingPlan(true);
          return;
        }
        // It clears on the next valid commit.
        if (badTime[input.dataset.timeFor]) {
          const next = { ...badTime };
          delete next[input.dataset.timeFor];
          badTime = next;
        }
        store.setPlanItemWindow(state.selectedDay, input.dataset.timeFor, { [which]: text });
      });
    });

    // The warning strips' one-tap fixes.
    delegate(root, '[data-fix]', (el) => {
      const list = store.dayIssues().get(el.dataset.fixFor) || [];
      const issue = list[Number(el.dataset.issue)];
      store.applyIssueFix(state.selectedDay, el.dataset.fixFor, issue?.fixes[Number(el.dataset.fix)]);
    });

    delegate(root, '[data-act="review"]', () => go('review'));
    delegate(root, '[data-act="later"]', () => { later = true; store.selectDay(state.selectedDay); });


    delegate(root, '[data-act="paste"]', () => go('paste'));
    delegate(root, '[data-new-loop]', (el) => {
      laneSheet = { from: Number(el.dataset.from), to: Number(el.dataset.to), label: el.dataset.label };
      store.selectDay(state.selectedDay);
    });

    delegate(root, '[data-act="add-open"]', () => {
      addOpen = true; addError = ''; notice = ''; store.setEditingPlan(true);
    });
    delegate(root, '[data-act="add-cancel"]', () => {
      if (pending) return;
      addOpen = false; addError = ''; store.setEditingPlan(true);
    });
    delegate(root, '[data-act="add-save"]', async () => {
      if (pending) return;
      const placeID = root.querySelector('#add-place')?.value || '';
      const typed = root.querySelector('#add-name')?.value.trim();
      // Was `if (!typed && !placeID) return;` — a primary that ignored a tap
      // and said nothing. It now answers in the field it is about, in rust,
      // and the button stays live: the app does not pre-disable, it refuses
      // out loud.
      if (!typed && !placeID) {
        addError = 'A name, or a map link.';
        // Keep whatever was typed in the other fields across the repaint, or
        // a refusal quietly throws away the times the user just set.
        form = {
          name: typed || '',
          start: root.querySelector('#add-start')?.value.trim() || '',
          end: root.querySelector('#add-end')?.value.trim() || '',
          kind: root.querySelector('[name="add-kind"]:checked')?.value || 'main',
        };
        store.setEditingPlan(true);
        root.querySelector('#add-name')?.focus();
        return;
      }
      addError = '';

      const start = root.querySelector('#add-start')?.value.trim() || '09:00';
      const end = root.querySelector('#add-end')?.value.trim() || '';
      const kind = root.querySelector('[name="add-kind"]:checked')?.value || 'main';

      // R8: the form STAYS UP until the work resolves. It used to close on
      // this line and leave `Adding…` at the top of the screen, above a form
      // that was no longer there.
      form = { name: typed || '', start, end, kind };
      pending = /^https?:/i.test(typed) ? 'link' : 'add';
      notice = '';
      store.setEditingPlan(true);

      const result = await store.captureStop(state.selectedDay, {
        input: typed, time: start, endTime: end, kind, placeID: placeID || null,
      });

      pending = '';
      notice = result.saved
        ? (result.located ? '' : `"${result.name}" was added without a location, so it will not show on the map.`)
        : result.reason;
      // Only a saved stop closes the form and clears it. A failure leaves the
      // form up with what was typed still in it, so the retry is one tap.
      if (result.saved) {
        addOpen = false;
        form = { name: '', start: '', end: '', kind: 'main' };
      }
      store.setEditingPlan(true);
    });

    root.querySelector('#add-place')?.addEventListener('change', (event) => {
      const hit = store.place(event.target.value);
      const nameBox = root.querySelector('#add-name');
      if (hit && nameBox && !nameBox.value.trim()) nameBox.value = hit.name;
    });

    swipeToDelete(root, {
      rowSelector: '[data-plan-row]',
      name: (el) => el.dataset.planName,
      label: () => 'Off the trip for good — not into the archive',
      onDelete: (el) => store.deletePlanItem(state.selectedDay, el.dataset.planRow),
    });
    swipeToDelete(root, {
      rowSelector: '[data-loop-row]',
      name: (el) => el.dataset.loopName,
      label: () => 'The places you picked stay saved',
      onDelete: (el) => store.deleteSubRoute(el.dataset.loopRow),
    });

    if (state.editingPlan) {
      bindDragReorder(root, {
        rowSelector: '[data-row-id]',
        handleSelector: '[data-grip]',
        onDrop: (movedId, beforeId) => store.movePlanItem(state.selectedDay, movedId, beforeId),
      });
    }
  },
};

// ------------------------------------------------------------------- a stop

function stopRow(row, { editing, number, last, issues }) {
  const { item } = row;
  const w = row.window;
  const worst = issues.find((i) => i.kind === 'order' || i.kind === 'overlap' || i.kind === 'reversed');

  return html`
    <div class="plan-row" data-row-id="${item.id}">
      ${editing ? html`<div class="handle-grip" data-grip>${raw(icon.grip)}</div>` : ''}

      <div class="plan-gutter${editing ? ' editing' : ''}">
        ${editing ? html`
          <input class="edge" value="${w.startLabel}" data-time-for="${item.id}" data-edge="start"
                 inputmode="numeric" aria-label="Starts">
          <input class="edge" value="${w.endLabel || '—'}" data-time-for="${item.id}" data-edge="end"
                 inputmode="numeric" aria-label="Ends, or a dash for an open end">
          <div class="edge-derived"${badTime[item.id] ? raw(' style="color:var(--danger-fg)"') : ''}>${
            badTime[item.id] ? 'not a time' : w.durationLabel}</div>
        ` : html`
          <div class="plan-clock${worst ? ' bad' : ''}">${w.startLabel}</div>
          ${w.endLabel ? html`<div class="plan-end${worst ? ' bad' : ''}">${w.endLabel}</div>` : ''}
          ${w.minutes ? html`<div class="edge-derived">${w.durationLabel}</div>` : ''}
        `}
      </div>

      <div class="plan-spine">
        <div class="plan-dot${worst ? ' bad' : ''}"></div>
        ${last ? '' : html`<div class="plan-line"></div>`}
      </div>

      <div class="plan-card${worst ? ' flagged' : ''}" data-open="${item.id}"
           role="button" tabindex="0" aria-label="${item.name}">
        <div class="row g8" style="align-items:flex-start">
          <div class="grow">
            <div class="plan-name">${item.name}</div>
            ${item.note ? html`<div class="plan-note">${item.note}</div>` : ''}
          </div>
          ${editing
            ? html`<button class="plan-remove" data-act="remove" data-id="${item.id}" aria-label="Remove ${item.name}">✕</button>`
            : html`<span class="badge main">MAIN${number ? ` ${number}` : ''}</span>`}
        </div>

        ${issues.map((issue, at) => html`
          <div class="warn">
            <div class="warn-label">${issue.label}</div>
            ${issue.name ? html`<div class="warn-name">${issue.name}</div>` : ''}
            <div class="warn-fact">${issue.fact}</div>
            ${issue.fixes.length ? html`
              <div class="row g6 wrap mt8">
                ${issue.fixes.map((fix, fi) => html`
                  <button class="warn-fix${fi === 0 ? ' first' : ''}" data-fix="${fi}"
                          data-issue="${at}" data-fix-for="${item.id}">${fix.label}</button>`)}
              </div>` : ''}
          </div>`)}

        ${!editing ? stopChips(item) : ''}
      </div>
    </div>`;
}

/**
 * An update is waiting. It says who sent it and how much of it there is, and
 * opens the review — it never changes the day by itself, because on this
 * model nothing does but you.
 */
function updateBanner(waiting) {
  return html`
    <div class="moved mt14">
      <div class="moved-h">${waiting.from} sent an update · ${when(waiting.at)}</div>
      <div class="f12 lh145" style="color:var(--charcoal)">
        ${waiting.line}. Nothing has changed on your copy — you decide what to take,
        one thing at a time.
      </div>
      <div class="moved-acts">
        <button class="btn ink grow" style="height:38px" data-act="review">See what changed</button>
        <button class="btn ghost none" style="width:96px;height:38px" data-act="later">Later</button>
      </div>
    </div>`;
}

/** "Tue 14:10" for this week, a date once it is older than that. */
function when(iso) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const days = Math.floor((Date.now() - at.getTime()) / 86_400_000);
  const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
  if (days < 1) return time;
  if (days < 7) return `${at.toLocaleDateString('en-GB', { weekday: 'short' })} ${time}`;
  return store.stamp(iso);
}

/** What else hangs off this stop, worth seeing without opening it. */
function stopChips(item) {
  const shopping = state.shopping.filter((r) => r.placeID === item.placeID).length;
  const shots = store.shotsFor(item.placeID).length;
  const notes = store.notesForPlace(item.placeID, { name: item.name }).length;
  const unlocated = item.placeID && !store.place(item.placeID)?.latitude;
  if (!shopping && !shots && !notes && !unlocated) return '';
  return html`
    <div class="row g6 wrap mt8">
      ${unlocated ? html`<span class="chip amber">No position · add a link</span>` : ''}
      ${shopping ? html`<span class="chip">${shopping} shopping item${shopping === 1 ? '' : 's'}</span>` : ''}
      ${shots ? html`<span class="chip">${shots} must-see</span>` : ''}
      ${notes ? html`<span class="chip">${notes} note${notes === 1 ? '' : 's'}</span>` : ''}
    </div>`;
}

// -------------------------------------------------------------------- a lane

/**
 * A gap, and whatever free time lives in it. An empty lane is still drawn:
 * seeing that you have two hours loose between the deck and the hotel is the
 * point, and the dashed row is where a sub route starts.
 */
function laneRow(lane, { editing, last }) {
  // An empty lane outside edit mode is just a gap in the day, and drawing a
  // dashed "+ Sub route here" button in every one of them turned the Plan
  // into a form. Adding is an edit; it lives behind the pencil.
  //
  // The one exception: a joined trip's own free time is yours to plan even
  // when you are not editing the agent's route, so it keeps a single amber
  // action — the "yours, inside theirs" case (§2.3). `dayTimeline()` only
  // ever produces a lane row here when the gap already clears
  // MIN_LANE_MINUTES, so there is nothing further to check.
  if (!editing && !lane.loops.length) {
    return store.isSharedEmptyKind('subRoutes') ? sharedLaneRow(lane, last) : '';
  }

  return html`
    <div class="plan-row">
      <div class="plan-gutter">
        ${lane.loops.length ? '' : html`
          <div class="lane-span">${store.duration(lane.to - lane.from).toUpperCase()}</div>`}
      </div>
      <div class="plan-spine">
        <div class="plan-line sub${last ? ' short' : ''}"></div>
      </div>
      <div class="grow">
        ${lane.loops.map((loop) => loopCard(loop, editing))}
        ${editing ? html`
          <button class="lane-add${lane.loops.length ? ' more' : ''}"
                  data-new-loop="1" data-from="${lane.from}" data-to="${lane.to}" data-label="${lane.label}">
            ${lane.loops.length
              ? '+ Another sub route here'
              : `+ Sub route here · ${clock(lane.from)} – ${clock(lane.to)}`}
          </button>` : ''}
      </div>
    </div>`;
}

/** Tier 3's one legitimate action: your own free time, in a lane the agent's
 * itinerary left open. Reuses the same `data-new-loop` handler edit mode
 * uses — no new control, just the amber "self-planned" recipe instead of
 * the neutral dashed one, and reachable without opening the pencil. */
function sharedLaneRow(lane, last) {
  return html`
    <div class="plan-row">
      <div class="plan-gutter">
        <div class="lane-span">${store.duration(lane.to - lane.from).toUpperCase()}</div>
      </div>
      <div class="plan-spine">
        <div class="plan-line sub${last ? ' short' : ''}"></div>
      </div>
      <div class="grow">
        <button class="lane-add shared" data-new-loop="1" data-from="${lane.from}" data-to="${lane.to}" data-label="${lane.label}">
          + Plan free time here
        </button>
      </div>
    </div>`;
}

function loopCard(loop, editing = false) {
  const card = store.loopCard(loop);
  if (!card) return '';
  return html`
    <div class="swipe-row plan-swipe"${editing ? raw(` data-loop-row="${esc(card.id)}" data-loop-name="${esc(card.name)}"`) : ''}>
      ${editing ? html`
        <div class="swipe-bin">
          <button class="bin" data-swipe-delete aria-label="Delete ${card.name}">${raw(icon.bin)}</button>
        </div>` : ''}
      <button class="swipe-face loop-lane" data-open-loop="${card.id}" aria-label="${card.name}">
        <div class="row g8" style="align-items:baseline">
          <div class="grow loop-lane-name">${card.name}</div>
          <div class="loop-lane-win">${card.window}</div>
        </div>
        <div class="plan-note">${card.line}</div>
        <div class="row g6 wrap mt8">
          ${card.over
            ? html`<span class="chip danger">${store.duration(card.over)} over the window</span>`
            : (card.spare ? html`<span class="chip jade">${store.duration(card.spare)} spare</span>` : '')}
          ${Number(card.km) > 0 ? html`<span class="chip">${card.km} km walk</span>` : ''}
          ${card.notes ? html`<span class="chip">${card.notes} note${card.notes === 1 ? '' : 's'}</span>` : ''}
        </div>
      </button>
    </div>`;
}

/**
 * Starting a sub route. The window is pre-filled from the lane that was
 * tapped and stays editable; both ends come from the day's stops and need
 * not match — end at the station and the walk is one way.
 */
function laneForm(day, issues) {
  const stops = store.loopEndpointOptions();
  const inside = stops.filter((s) => parseClock(s.time) != null);
  const from = clock(laneSheet.from);
  const to = clock(laneSheet.to);
  const part = laneSheet.from < 12 * 60 ? 'morning' : laneSheet.from < 17 * 60 ? 'afternoon' : 'evening';

  return html`
    <section class="screen">
      <div class="head">
        <div class="head-row center">
          <button class="iconbtn" data-act="lane-cancel" aria-label="Back">${raw(icon.close)}</button>
          <div class="grow">
            <div class="push-title">New sub route</div>
            <div class="push-sub">Day ${day?.dayNumber} ${part} · ${laneSheet.label}</div>
          </div>
        </div>
      </div>

      <div class="scroll" style="padding:14px 16px 24px">
        <div class="f13 w700">Free time, ${from} – ${to}</div>
        <div class="f125 muted lh145 mt6">
          Both ends are editable — the sub route protects the later one.
        </div>

        <div class="col g10 mt16">
          <label>
            <div class="eyebrow">NAME</div>
            <input id="lane-name" class="mt4" style="width:100%" placeholder="Night market">
          </label>

          <div class="row g8">
            <label class="grow">
              <div class="eyebrow">LEAVE</div>
              <input id="lane-from" class="mt4" style="width:100%" value="${from}" inputmode="numeric">
            </label>
            <label class="grow">
              <div class="eyebrow">BE BACK BY</div>
              <input id="lane-to" class="mt4" style="width:100%" value="${to}" inputmode="numeric">
            </label>
          </div>

          ${inside.length ? html`
            <div class="row g8">
              <label class="grow">
                <div class="eyebrow">START AT</div>
                <select id="lane-start" class="mt4" style="width:100%">
                  ${inside.map((e) => html`<option value="${e.id}">${e.label}</option>`)}
                </select>
              </label>
              <label class="grow">
                <div class="eyebrow">END AT</div>
                <select id="lane-end" class="mt4" style="width:100%">
                  ${inside.map((e) => html`<option value="${e.id}">${e.label}</option>`)}
                </select>
              </label>
            </div>
            <div class="f11 soft lh145">
              Both ends come from the day's stops, and they need not match — end at the station
              and the walk is one way.
            </div>` : html`
            <div class="f11 soft lh145">
              This day has no stops with a position yet, so the sub route starts and ends
              wherever you are.
            </div>`}
        </div>

        <div class="row g8 mt18">
          <button class="btn jade grow" data-act="lane-save">Create and pick places</button>
          <button class="btn ghost" style="width:96px" data-act="lane-cancel">Cancel</button>
        </div>
        <div class="f11 soft lh145 mt10">
          A day can hold a sub route in every gap. Two sub routes never share a window, so the
          times in one can never move the other.
        </div>
      </div>
    </section>`;
}

function mountLaneForm(root) {
  delegate(root, '[data-act="lane-cancel"]', () => {
    laneSheet = null;
    store.selectDay(state.selectedDay);
  });
  delegate(root, '[data-act="lane-save"]', () => {
    const loop = store.addSubRoute(state.selectedDay, {
      name: root.querySelector('#lane-name')?.value,
      depart: root.querySelector('#lane-from')?.value,
      returnBy: root.querySelector('#lane-to')?.value,
      startPlaceID: root.querySelector('#lane-start')?.value || null,
      endPlaceID: root.querySelector('#lane-end')?.value || null,
    });
    laneSheet = null;
    if (loop) go('nearby', { loopID: loop.id, anchorID: loop.startPlaceID });
  });
}

// ------------------------------------------------------------------- the rest

function emptyDay() {
  const wx = store.weather();
  return html`
    <div class="col center g6 mt18" style="padding:26px 8px;text-align:center">
      <div class="lane-stub"></div>
      <div class="f15 w700">The day is empty</div>
      <div class="f125 lh155 muted" style="max-width:280px">
        Add the stops your agent gave you and the gaps between them become free time by
        themselves. Start with the hotel as the first and last stop — a sub route needs
        somewhere to leave from and come back to.
      </div>
      <div class="col g8 mt14" style="width:100%">
        <button class="btn ink" data-act="add-open">+ Add the first stop</button>
        <button class="btn ghost" data-act="paste">Paste an itinerary</button>
      </div>
      <div class="f11 soft lh145 mt12" style="max-width:280px">
        Paste a map link and the stop arrives with its position, and its hours where
        OpenStreetMap has them.${wx ? ` Forecast: ${wx.icon} ${wx.high} °C.` : ''}
      </div>
      <div class="lane-stub mt6"></div>
    </div>`;
}

/**
 * Tier 3: the same empty day, in a joined trip. Frame 1F, drawn deliberately
 * beside 1B — same screen, same date, same emptiness, different owner. A
 * stopless day never gets an action (S-4): `dayTimeline()` only ever builds
 * a lane between stops, so there is nothing here yet to hang free time on.
 */
function sharedEmptyDay(day) {
  return html`
    <div class="mt18">
      ${emptyShared({ title: `Day ${day?.dayNumber ?? ''} is empty in the copy you were sent.` })}
    </div>`;
}

function addForm() {
  const saved = store.allPlaces();
  return html`
    <div class="form mt8">
      <div class="form-title">Add a stop</div>

      <input id="add-name" placeholder="Name, or paste a Google / Apple Maps link" value="${form.name}">
      ${addError ? html`
        <div class="f11 lh145" style="color:var(--danger-fg);margin-top:-4px">${addError}</div>` : ''}

      ${saved.length ? html`
        <select id="add-place">
          <option value="">…or pick somewhere you have saved</option>
          ${saved.map((p) => html`<option value="${p.id}">${p.name}</option>`)}
        </select>` : ''}

      <div class="row g6 wrap">
        ${[['main', "The agent's route"], ['sub', 'My own plan']].map(([value, label]) => html`
          <label class="pill small" style="background:#fff;border:1px solid var(--field)">
            <input type="radio" name="add-kind" value="${value}"${value === form.kind ? ' checked' : ''}
                   style="width:14px;height:14px;padding:0;margin:0;accent-color:#14201C">
            ${label}
          </label>`)}
      </div>

      <div class="row g8">
        <label class="none">
          <span class="f11 soft">Starts</span>
          <input id="add-start" placeholder="09:00" value="${form.start}" style="width:82px" inputmode="numeric">
        </label>
        <label class="none">
          <span class="f11 soft">Ends</span>
          <input id="add-end" placeholder="—" value="${form.end}" style="width:82px" inputmode="numeric">
        </label>
        <button class="btn jade grow" style="align-self:flex-end" data-act="add-save"${
          pending ? raw(' disabled aria-busy="true"') : ''}>${
          pending === 'link' ? 'Reading that link…' : (pending === 'add' ? 'Adding…' : 'Add')}</button>
        <button class="btn ghost none" data-act="add-cancel"
                style="width:38px;align-self:flex-end${pending ? ';pointer-events:none' : ''}" aria-label="Cancel">✕</button>
      </div>

      <div class="form-hint">
        The same way you add a place anywhere else: type a name, paste a map link, or pick
        something you saved earlier. A link brings the position with it, and opening hours
        where OpenStreetMap has them. Leave the end blank for the last stop of a day.
      </div>
    </div>`;
}

/**
 * Removed stops stay visible on the day so you can still open them and read
 * their info. Putting one back, or moving it to another day, is an edit — so
 * those controls only appear in edit mode.
 */
function archive(rows, editing) {
  const dayCount = state.trip?.dayCount || 6;
  return html`
    <div class="mt18">
      <div class="eyebrow">REMOVED FROM THIS DAY</div>
      ${moved ? html`
        <!-- N-9 · the receipt, into .archive-moved — a class app.css has
             carried since it was written with no JS caller, and this is
             exactly the string it was defined for. The card the stop was in
             has genuinely left this day, so the receipt stands where it was
             until the next repaint. -->
        <div class="swipe-face archive-card mt8">
          <div class="archive-name">${moved.name}</div>
          <div class="archive-moved">Moved to Day ${moved.to}.</div>
        </div>` : ''}
      ${rows.map((item) => html`
        <div class="swipe-row mt8"${editing ? raw(` data-plan-row="${esc(item.id)}" data-plan-name="${esc(item.name)}"`) : ''}>
          ${editing ? html`
            <div class="swipe-bin"><button class="bin" data-swipe-delete aria-label="Delete ${item.name}">${raw(icon.bin)}</button></div>` : ''}
          <div class="swipe-face archive-card">
            <div class="row g8" style="align-items:flex-start">
              <button class="grow" style="text-align:left" data-open="${item.id}">
                <div class="archive-name">${item.name}</div>
                <div class="archive-was">was ${item.time} · tap to open</div>
              </button>
              ${editing
                ? html`<button class="archive-btn" data-act="restore" data-id="${item.id}">Add back</button>`
                : ''}
            </div>
            ${editing ? html`
              <div class="row g6 center mt8 wrap">
                <span class="archive-move">MOVE TO</span>
                ${Array.from({ length: dayCount }, (_, i) => i + 1)
                  .filter((n) => n !== state.selectedDay)
                  .map((n) => html`<button class="archive-day" data-act="move-day" data-id="${item.id}" data-to="${n}">D${n}</button>`)}
              </div>` : ''}
          </div>
        </div>`)}
    </div>`;
}
