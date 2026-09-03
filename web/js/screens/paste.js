// Paste an itinerary, item 01.
//
// The screen exists because the itinerary already exists — as a PDF from the
// agent, or as a WhatsApp message — and typing six days of it into a phone is
// the thing that makes the app not worth opening. With no paid API and no
// server, parsing happens on the device, so this is paste-and-confirm and
// never magic: text in, candidate stops out, every field correctable, and
// nothing lands on the trip until you press the button at the bottom.
//
// The screen is designed around the half-understood row, because that is the
// normal one. A row the parser was unsure about is kept, flagged, sorted
// nowhere special, and editable in place — it is never quietly dropped, and
// it never quietly lands wrong.

import { html, raw, icon, delegate, parseClock, parseDuration, clock, duration } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { backHeader, checkbox } from './parts.js';
import { parseItinerary } from '../itinerary.js';

const EXAMPLE = `DAY 3 — Old Quarter
08:30 Depart Hotel Meridian
coach bay 2, guide Ms. Ren
09:15-10:00 Lumen Crossing
10:30 Ashgate Shrine (1h)
12:00 Harbour Steps · set lunch
13:30 – 15:45 Nishi Market
16:00 Skyline Deck (1 hour)`;

/** 'paste' → 'confirm' → 'done'. */
let phase = 'paste';
let text = '';
let read = null;
let onlyFlagged = false;
let result = null;
let busy = '';

export default {
  id: 'paste',
  tab: 'plan',

  render() {
    if (phase === 'done') return doneView();
    if (phase === 'confirm') return confirmView();
    return pasteView();
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => {
      if (phase === 'confirm') { phase = 'paste'; repaint(); return; }
      reset();
      back();
    });
    delegate(root, '[data-act="plan"]', () => { reset(); go('plan', {}, { replace: true }); });

    const box = root.querySelector('#paste-text');
    box?.addEventListener('input', () => { text = box.value; });
    box?.addEventListener('change', () => { text = box.value; });

    delegate(root, '[data-act="example"]', () => {
      text = EXAMPLE;
      repaint();
    });

    delegate(root, '[data-act="read"]', () => {
      // Read the field itself rather than the last state we saw: the button
      // must work on the first tap after a paste, with no repaint in between.
      if (box) text = box.value;
      if (!text.trim()) {
        busy = 'Nothing pasted yet — put the itinerary in the box above.';
        repaint();
        return;
      }
      busy = '';
      read = parseItinerary(text, {
        startDate: state.trip?.startDate,
        dayCount: state.trip?.dayCount,
      });
      phase = 'confirm';
      onlyFlagged = false;
      repaint();
    });

    delegate(root, '[data-act="again"]', () => { phase = 'paste'; read = null; repaint(); });
    delegate(root, '[data-act="only-flagged"]', () => { onlyFlagged = !onlyFlagged; repaint(); });
    delegate(root, '[data-act="all-on"]', () => {
      for (const row of read.rows) row.include = true;
      repaint();
    });
    delegate(root, '[data-act="all-off"]', () => {
      for (const row of read.rows) row.include = false;
      repaint();
    });

    delegate(root, '[data-act="toggle-row"]', (el) => {
      const row = rowByID(el.dataset.id);
      if (row) row.include = !row.include;
      repaint();
    });

    // Every field on a candidate is editable, and the flags recompute as soon
    // as one is corrected.
    root.querySelectorAll('[data-field]').forEach((input) => {
      input.addEventListener('change', () => {
        const row = rowByID(input.dataset.for);
        if (!row) return;
        const value = input.value.trim();

        if (input.dataset.field === 'name') row.name = value;
        if (input.dataset.field === 'day') row.dayNumber = Number(value) || 1;
        if (input.dataset.field === 'time') {
          const at = parseClock(value);
          row.time = at == null ? '' : clock(at);
        }
        if (input.dataset.field === 'duration') {
          row.durationMinutes = value === '' ? null : (parseDuration(value) || null);
        }
        recheck(row);
        repaint();
      });
    });

    delegate(root, '[data-act="import"]', async () => {
      busy = 'Adding them to the trip…';
      repaint();
      result = await store.importItinerary(read.rows);
      busy = '';
      phase = 'done';
      repaint();
    });
  },
};

// --------------------------------------------------------------------- views

function pasteView() {
  return html`
    <section class="screen">
      ${backHeader({
        title: 'Paste an itinerary',
        sub: 'Text in, stops out — you confirm every one',
      })}

      <div class="scroll" style="padding:14px 16px 24px">
        <textarea id="paste-text" class="paste-area"
                  placeholder="Paste the agent's itinerary, or the WhatsApp message…">${text}</textarea>

        <div class="row g8 mt10">
          <button class="btn jade grow" data-act="read">Read it</button>
          <button class="btn ghost none" style="width:104px" data-act="example">Example</button>
        </div>
        ${busy ? html`<div class="amber-note f12 mt8">${busy}</div>` : ''}

        <div class="card pad mt14">
          <div class="eyebrow">WHAT IT CAN AND CANNOT DO</div>
          <div class="f125 lh145 mt8" style="color:var(--charcoal)">
            It reads day headings — <b>Day 3</b>, <b>第三天</b>, <b>Mar 14</b>, <b>14/3</b> — and then
            takes a time, a length and a name off each line beneath them. A line with no time of
            its own that reads like a sentence is kept as a note on the stop above it.
          </div>
          <div class="f115 lh145 mt10 muted">
            It does not look anything up. Nothing here touches the network, so the stops arrive
            with no position, no opening hours and no phone number — open one later and paste its
            map link to fill those in. And it will misread lines: that is what the next screen
            is for.
          </div>
        </div>

        <div class="f11 soft lh145 mt10">
          Pasting from a PDF usually works; the text has to be selectable in the PDF for your
          phone to copy it. A photograph of a printed itinerary cannot be read here.
        </div>
      </div>
    </section>`;
}

function confirmView() {
  const rows = read.rows;
  const flagged = rows.filter((r) => r.issues.length);
  const chosen = rows.filter((r) => r.include);
  const shown = onlyFlagged ? flagged : rows;
  const days = [...new Set(chosen.map((r) => r.dayNumber))].sort((a, b) => a - b);
  const dayCount = Math.max(state.trip?.dayCount || 1, ...rows.map((r) => r.dayNumber), 1);

  return html`
    <section class="screen">
      ${backHeader({
        title: `${rows.length} stop${rows.length === 1 ? '' : 's'} read`,
        sub: days.length ? `Landing on day${days.length === 1 ? '' : 's'} ${days.join(', ')}` : 'Nothing ticked yet',
      })}

      <div class="scroll" style="padding:12px 16px 150px">
        ${flagged.length ? html`
          <button class="day-alert row g8 center" data-act="only-flagged" style="width:100%;text-align:left">
            <span class="grow">
              ${flagged.length} of ${rows.length} need${flagged.length === 1 ? 's' : ''} a look — a
              missing time, a guessed day, or a line that may be two stops.
            </span>
            <span class="chip ${onlyFlagged ? 'jade' : ''}">${onlyFlagged ? 'showing these' : 'show only these'}</span>
          </button>` : html`
          <div class="hint-jade">Every line read cleanly. Check the names and press the button below.</div>`}

        <div class="row g8 center mt10 mb8">
          <div class="grow f115 w700 muted">${chosen.length} of ${rows.length} ticked</div>
          <button class="chip" data-act="all-on">Tick all</button>
          <button class="chip" data-act="all-off">Untick all</button>
        </div>

        ${shown.length ? shown.map((row) => candidate(row, dayCount)) : html`
          <div class="empty">Nothing flagged. Press "show only these" again to see them all.</div>`}

        ${read.skipped ? html`
          <div class="f11 soft lh145 mt10">
            ${read.skipped} line${read.skipped === 1 ? '' : 's'} were left out — headings, blank
            lines, and lines with nothing in them but a time.
          </div>` : ''}
      </div>

      <div class="dock">
        <div class="grow">
          <div class="dock-h">${busy ? 'WORKING' : 'READY'}</div>
          <div class="dock-s">
            ${busy || (chosen.length
              ? `Add ${chosen.length} stop${chosen.length === 1 ? '' : 's'}`
              : 'Tick at least one stop')}
          </div>
        </div>
        <button class="dock-btn quiet" data-act="again">Start again</button>
        <button class="btn jade none" style="height:38px;padding:0 14px"
                data-act="import"${chosen.length && !busy ? '' : ' disabled'}>Add them</button>
      </div>
    </section>`;
}

function candidate(row, dayCount) {
  const worst = row.issues.some((i) => /past the end|two stops/.test(i)) ? 'danger' : 'amber';
  return html`
    <div class="cand${row.include ? '' : ' off'}${row.issues.length ? ` flag ${worst}` : ''}">
      <div class="row g10 center">
        ${checkbox(row.include, { act: 'toggle-row', id: row.id, size: 22 })}
        <input class="cand-name grow" value="${row.name}" data-field="name" data-for="${row.id}"
               aria-label="Name of this stop">
        <span class="cand-tick${row.include ? ' on' : ''}">${row.include ? 'in' : 'out'}</span>
      </div>

      <div class="row g6 center mt8 wrap">
        <select class="cand-day" data-field="day" data-for="${row.id}" aria-label="Which day">
          ${Array.from({ length: dayCount }, (_, i) => i + 1).map((n) => html`
            <option value="${n}"${n === row.dayNumber ? ' selected' : ''}>Day ${n}</option>`)}
        </select>
        <input class="cand-time" value="${row.time}" placeholder="--:--" inputmode="numeric"
               data-field="time" data-for="${row.id}" aria-label="Start time">
        <span class="dur-k">FOR</span>
        <input class="cand-dur" value="${row.durationMinutes || ''}" placeholder="—" inputmode="numeric"
               data-field="duration" data-for="${row.id}" aria-label="How long, in minutes">
        <span class="dur-k">MIN</span>
        <span class="dur-out">
          ${row.time && row.durationMinutes
            ? `ends ${clock(parseClock(row.time) + row.durationMinutes)}`
            : (row.durationMinutes ? duration(row.durationMinutes) : 'no end set')}
        </span>
      </div>

      ${row.note ? html`<div class="cand-note">${row.note}</div>` : ''}
      ${row.issues.map((issue) => html`<div class="plan-warn">${issue}</div>`)}
    </div>`;
}

function doneView() {
  const added = result?.added || 0;
  return html`
    <section class="screen">
      ${backHeader({ title: 'Added', sub: `${added} stop${added === 1 ? '' : 's'} on your itinerary` })}
      <div class="scroll" style="padding:14px 16px 24px">
        <div class="card pad">
          <div class="eyebrow jade">DONE</div>
          <div class="f125 lh145 mt8" style="color:var(--charcoal)">
            ${added} stop${added === 1 ? '' : 's'} added.
            ${result?.placesMade ? `${result.placesMade} new place${result.placesMade === 1 ? '' : 's'} were created for them` : ''}${result?.reused ? `, and ${result.reused} matched somewhere you had already saved` : ''}.
            ${result?.lengthened ? `The trip was lengthened by ${result.lengthened} day${result.lengthened === 1 ? '' : 's'} to fit.` : ''}
          </div>
          <div class="f115 lh145 mt10 muted">
            None of them has a position yet, so they will not appear on the map until you open one
            and paste its map link. Everything else — times, notes, shopping, must-see shots —
            works on them straight away.
          </div>
          <button class="btn jade mt14" data-act="plan">Open the Plan</button>
        </div>

        <div class="f11 soft lh145 mt12">
          Pasting again adds to what is there rather than replacing it, so a second half of the
          itinerary can arrive separately. A stop that landed on the wrong day can be dragged, or
          removed from the day in Plan's edit mode.
        </div>
      </div>
    </section>`;
}

// -------------------------------------------------------------------- helpers

const rowByID = (id) => read?.rows.find((r) => r.id === id) || null;

/** Recomputes one row's flags after it has been corrected by hand. */
function recheck(row) {
  const issues = [];
  if (!row.time) issues.push('No time — set one, or leave it and fix it on the day');
  if (!String(row.name || '').trim()) issues.push('No name, so this one cannot be added');
  if (row.name.length > 70) issues.push('That is a long name — it may be two stops on one line');
  if (state.trip?.dayCount && row.dayNumber > state.trip.dayCount) {
    issues.push(`Day ${row.dayNumber} is past the end of this trip — the trip will be lengthened`);
  }
  row.issues = issues;
  row.dayGuessed = false;
}

function repaint() {
  // Through the store, so the paint keeps this screen's scroll position.
  store.selectDay(state.selectedDay);
}

function reset() {
  phase = 'paste';
  text = '';
  read = null;
  result = null;
  onlyFlagged = false;
  busy = '';
}
