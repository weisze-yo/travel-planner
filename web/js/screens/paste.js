// Paste an itinerary.
//
// The itinerary already exists — as a PDF from the agent, or as a WhatsApp
// message — and typing six days of it into a phone is the thing that makes
// the app not worth opening. With no server, parsing happens on the device,
// so this is paste-and-confirm and never magic.
//
// Five states, and only the last one writes anything:
//
//   paste    the whole message in one field, and a plain statement of what
//            it will look for, so a bad read is not a mystery
//   review   every row graded — read, worked out, could not read — with day
//            headings from the text. No bulk accept: each row is ticked,
//            fixed or dropped, because this is the one place a wrong row is
//            cheap to remove
//   row      one row open over the list, with the line as pasted at the top
//   summary  what will be created, per day, and the two honest caveats
//   done     landed on the Plan with a receipt

import { html, raw, icon, delegate, parseClock, clock } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { go, back } from '../nav.js';
import { backHeader } from './parts.js';
import { parseItinerary } from '../itinerary.js';

const EXAMPLE = `DAY 3 – Sat 14 Mar
08:30 depart Hotel Meridian (coach bay 2)
09:15 Lumen Crossing – 45 mins photo stop
10:30 Ashgate Shrine (1 hr, shoulders covered)
12:00 set lunch, Harbour Steps
13:30-15:45 Nishi Market — free time, back at coach 15:45
16:00 Skyline Deck, sunset 18:04
evening free, dinner not included

DAY 4 – Sun 15 Mar
pickup 08:00 lobby
Kaede Dept Store & Riverside Outlet (whole day)`;

let phase = 'paste';
let text = '';
let read = null;
let openRow = null;
let result = null;
let busy = '';
/** A trip file that has been read but not yet turned into a trip. */
let imported = null;

export default {
  id: 'paste',
  tab: 'plan',

  render() {
    if (phase === 'done') return doneView();
    if (phase === 'summary') return summaryView();
    if (phase === 'review') return openRow ? rowView() : reviewView();
    return pasteView();
  },

  mount(root) {
    if (phase === 'review' && openRow) return mountRow(root);
    if (phase === 'review') return mountReview(root);
    if (phase === 'summary') return mountSummary(root);
    if (phase === 'done') {
      delegate(root, '[data-act="plan"]', () => { reset(); go('plan', {}, { replace: true }); });
      delegate(root, '[data-act="back"]', () => { reset(); go('plan', {}, { replace: true }); });
      return;
    }
    return mountPaste(root);
  },
};

// -------------------------------------------------------------------- paste

function pasteView() {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return html`
    <section class="screen">
      ${backHeader({
        title: 'Paste your itinerary',
        sub: state.trip?.name || 'This trip',
      })}

      <div class="scroll" style="padding:14px 16px 24px">
        <div class="f125 lh155" style="color:var(--charcoal)">
          Paste the whole thing — the agent's PDF, a WhatsApp message, an email. It is read on
          this phone; nothing is sent anywhere.
        </div>

        <textarea id="paste-text" class="paste-area mt12"
                  placeholder="DAY 1 — Thu 12 Mar&#10;09:00 Airport pickup…">${text}</textarea>

        <div class="row g6 wrap mt10">
          <button class="pick-chip" data-act="example">Example</button>
          <button class="pick-chip" data-act="clear">Clear</button>
          ${state.trip?.importedText ? html`
            <button class="pick-chip" data-act="reuse">Last import</button>` : ''}
          <span class="pick-chip soft">${words} word${words === 1 ? '' : 's'}</span>
        </div>

        <div class="card pad mt12">
          <div class="eyebrow">WHAT IT LOOKS FOR</div>
          <div class="f12 lh16 mt6" style="color:var(--charcoal)">
            Day headers — <b>Day 3</b>, <b>14 Mar</b>, <b>Sat 14/3</b>, <b>第三天</b> · no header,
            no new day<br>
            Times — <b>09:15</b>, <b>9.15am</b>, <b>13:30-15:45</b>, <b>下午3:00</b><br>
            One stop per line, name after the time
          </div>
          <div class="f11 soft lh145 mt8">
            A PDF has to be copied out as text first — the app cannot open the file itself.
          </div>
        </div>

        ${busy ? html`<div class="amber-note f12 mt10">${busy}</div>` : ''}

        <button class="btn jade mt12" style="width:100%" data-act="read">Read it</button>
        <div class="f11 soft lh145 mt8" style="text-align:center">
          Nothing is added to the trip yet. You confirm every row first.
        </div>

        <div class="hairline"></div>

        <div class="card pad">
          <div class="eyebrow">OR OPEN A TRIP FILE</div>
          <div class="f12 lh16 mt6" style="color:var(--charcoal)">
            Text is the fast way in from an email, but it can only carry what a sentence can
            say: names and times. A trip file carries the rest — where every stop is on the
            map, the sub routes, the places saved around them and the must-see spots.
          </div>
          <div class="f11 soft lh145 mt8">
            It is this app's own export, so the way to learn the format is to export a trip
            and read the file. Opening one makes a new trip; nothing here is touched.
          </div>
          ${imported ? html`
            <div class="card mt10" style="padding:11px 12px;background:var(--jade-bg);border-color:var(--jade-bd)">
              <div class="f12 w650" style="color:var(--jade)">${imported.name}</div>
              <div class="f11 lh145 mt3" style="color:var(--jade-fg)">
                ${imported.counts.stops} stops over ${imported.counts.days} days ·
                ${imported.counts.places} places · ${imported.counts.mustSee} must-see ·
                ${imported.counts.shopping} shopping · ${imported.counts.log} notes
              </div>
              <div class="row g8 mt10">
                <button class="btn jade grow" data-act="open-file">Make this a trip</button>
                <button class="btn ghost none" style="width:96px" data-act="other-file">Another</button>
              </div>
            </div>` : html`
            <label class="btn ghost wide mt10" style="cursor:pointer">
              Choose a trip file…
              <input id="trip-file" type="file" accept="application/json,.json" hidden>
            </label>`}
        </div>
      </div>
    </section>`;
}

function mountPaste(root) {
  root.querySelector('#trip-file')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    busy = `Reading ${file.name}…`;
    repaint();
    const read = store.readTripFile(await file.text());
    busy = read.ok ? '' : read.reason;
    imported = read.ok ? read : null;
    repaint();
  });

  delegate(root, '[data-act="other-file"]', () => { imported = null; busy = ''; repaint(); });

  delegate(root, '[data-act="open-file"]', async () => {
    if (!imported) return;
    busy = `Making ${imported.name}…`;
    repaint();
    const made = await store.importTrip(imported.data);
    imported = null;
    busy = '';
    if (made.ok) go('plan', {}, { replace: true });
    else { busy = made.reason; repaint(); }
  });

  delegate(root, '[data-act="back"]', () => { reset(); back(); });
  const box = root.querySelector('#paste-text');
  box?.addEventListener('input', () => { text = box.value; });
  box?.addEventListener('change', () => { text = box.value; });

  delegate(root, '[data-act="example"]', () => { text = EXAMPLE; busy = ''; repaint(); });
  delegate(root, '[data-act="clear"]', () => { text = ''; busy = ''; repaint(); });
  delegate(root, '[data-act="reuse"]', () => { text = state.trip?.importedText || ''; busy = ''; repaint(); });

  delegate(root, '[data-act="read"]', () => {
    if (box) text = box.value;
    if (!text.trim()) {
      busy = 'Nothing pasted yet — put the itinerary in the box above.';
      repaint();
      return;
    }
    read = parseItinerary(text, {
      startDate: state.trip?.startDate,
      dayCount: state.trip?.dayCount,
    });
    busy = '';
    phase = 'review';
    repaint();
  });
}

// ------------------------------------------------------------------- review

const outstanding = () => read.rows.filter((r) => !r.checked && !r.skipped);
const wanted = () => read.rows.filter((r) => r.checked && !r.skipped);

function reviewView() {
  const left = outstanding().length;
  const done = read.rows.length - left;
  const percent = read.rows.length ? Math.round((done / read.rows.length) * 100) : 0;
  const days = [...new Set(read.rows.map((r) => r.dayNumber))].sort((a, b) => a - b);

  return html`
    <section class="screen">
      <div class="head">
        <div class="head-row center">
          <button class="iconbtn" data-act="back" aria-label="Back">${raw(icon.back)}</button>
          <div class="grow">
            <div class="push-title">Check what it read</div>
            <div class="push-sub">
              ${read.rows.length} rows · ${days.length} day group${days.length === 1 ? '' : 's'} so far ·
              ${left} left to check
            </div>
          </div>
        </div>
        <div class="progress mt12"><i style="width:${percent}%"></i></div>
        <div class="f11 w650 muted mt8">
          ${done} of ${read.rows.length} checked${left ? ` · tick, fix or drop the other ${left}` : ' · nothing outstanding'}
        </div>
      </div>

      <div class="scroll" style="padding:12px 16px 96px">
        ${days.map((n) => html`
          <div class="row g8 center cand-day-head">
            <div class="grow f125 w700">
              Day ${n}${read.titles.get(n) ? ` · ${read.titles.get(n)}` : ''}
            </div>
            <span class="badge main">${read.titles.get(n) || read.sawAnyHeader ? 'FROM THE TEXT' : 'GUESSED'}</span>
          </div>
          ${read.rows.filter((r) => r.dayNumber === n).map((row) => candidate(row))}
        `)}

        ${read.skipped ? html`
          <div class="f11 soft lh145 mt10">
            ${read.skipped} line${read.skipped === 1 ? '' : 's'} were left out — headings, blank
            lines, and lines with nothing in them but a time.
          </div>` : ''}
      </div>

      <div class="review-foot">
        <div class="grow f115 w650 muted">
          ${left ? `${left} row${left === 1 ? '' : 's'} left to check` : `${wanted().length} stops ready`}
        </div>
        <button class="btn jade none" style="height:42px;padding:0 16px"
                data-act="summary"${left ? ' disabled' : ''}>Review and save</button>
      </div>
    </section>`;
}

/** One candidate, in whichever of the three grades it came back as. */
function candidate(row) {
  if (row.grade === 'unread' && !row.checked) return unreadRow(row);

  const worked = row.grade === 'worked' && !row.checked;
  const endGuess = row.inferred.find((i) => i.field === 'end');
  const noTime = row.inferred.find((i) => i.field === 'time');

  return html`
    <div class="cand ${row.checked ? 'done' : (worked ? 'worked' : 'plain')}${row.skipped ? ' off' : ''}">
      <div class="row g11 center">
        <button class="tick${row.checked ? ' on' : ''}" data-tick="${row.id}"
                role="checkbox" aria-checked="${row.checked ? 'true' : 'false'}"
                aria-label="Tick ${row.name}">${raw(icon.tick('#fff', 11))}</button>
        <div class="cand-when${worked ? ' worked' : ''}">
          <div>${row.time || '--:--'}</div>
          ${row.endTime ? html`<div class="cand-when-end">${row.endTime}</div>` : ''}
        </div>
        <button class="grow" style="text-align:left" data-open-row="${row.id}">
          <div class="f135 w650" style="line-height:1.25">${row.name}</div>
          ${row.note ? html`<div class="f11 soft mt2">${row.note}</div>` : ''}
          ${worked && (endGuess || noTime) ? html`
            <div class="f11 w650 mt2" style="color:var(--amber-fg)">${(noTime || endGuess).text}</div>` : ''}
        </button>
        ${row.skipped
          ? html`<span class="cand-tick">skipped</span>`
          : raw(icon.chevron)}
      </div>

      ${worked && endGuess && !noTime ? html`
        <div class="row g6 wrap cand-acts">
          <button class="warn-fix first" data-keep-end="${row.id}">Keep ${store.duration(minutesOf(row))}</button>
          <button class="warn-fix" data-open-row="${row.id}">Set the end time</button>
          <button class="warn-fix" data-clear-end="${row.id}">No end time</button>
        </div>` : ''}

      ${worked && noTime ? html`
        <div class="row g6 wrap cand-acts">
          <button class="warn-fix first" data-open-row="${row.id}">Give it a time</button>
          <button class="warn-fix" data-skip="${row.id}">Skip it</button>
        </div>` : ''}

      ${row.splittable && !row.checked ? html`
        <div class="row g6 wrap cand-acts">
          <span class="pick-chip soft">Two names in one line?</span>
          <button class="warn-fix first" data-split="${row.id}">Split into two stops</button>
          <button class="warn-fix" data-tick="${row.id}">Leave as one</button>
        </div>` : ''}

      ${movable(row) ? html`
        <div class="row g6 wrap cand-acts">
          <span class="pick-chip soft">MOVE TO</span>
          ${dayChips(row)}
        </div>` : ''}
    </div>`;
}

/**
 * Where a day boundary could plausibly be wrong: the first row of a group,
 * and any row whose day the parser had to guess. Offering it on every row
 * buries the rows that actually need a decision.
 */
function movable(row) {
  if (row.checked || row.skipped) return false;
  if (row.dayGuessed) return true;
  return read.rows.find((r) => r.dayNumber === row.dayNumber)?.id === row.id;
}

function dayChips(row) {
  const count = Math.max(state.trip?.dayCount || 1, ...read.rows.map((r) => r.dayNumber));
  return html`
    ${Array.from({ length: count }, (_, i) => i + 1).map((n) => html`
      <button class="archive-day${n === row.dayNumber ? ' on' : ''}" data-move="${row.id}" data-to="${n}">D${n}</button>`)}
    <button class="warn-fix" data-move-rest="${row.id}">and the rest below it</button>`;
}

/** The line it could not read, kept verbatim, with the three ways out. */
function unreadRow(row) {
  return html`
    <div class="cand unread">
      <div class="eyebrow">COULD NOT READ THIS LINE</div>
      <div class="cand-raw">${row.raw}</div>
      <div class="row g6 wrap cand-acts">
        <button class="warn-fix first" data-make-stop="${row.id}">Make it a stop</button>
        <button class="warn-fix" data-append="${row.id}">Add to the row above</button>
        <button class="warn-fix" data-skip="${row.id}">Skip it</button>
      </div>
    </div>`;
}

function mountReview(root) {
  delegate(root, '[data-act="back"]', () => { phase = 'paste'; repaint(); });
  delegate(root, '[data-act="summary"]', () => { phase = 'summary'; repaint(); });

  delegate(root, '[data-tick]', (el) => {
    const row = rowByID(el.dataset.tick);
    if (!row) return;
    row.checked = !row.checked;
    row.skipped = false;
    repaint();
  });
  delegate(root, '[data-skip]', (el) => {
    const row = rowByID(el.dataset.skip);
    if (!row) return;
    row.skipped = true;
    row.checked = false;
    repaint();
  });
  delegate(root, '[data-open-row]', (el) => { openRow = el.dataset.openRow; repaint(); });

  delegate(root, '[data-keep-end]', (el) => {
    const row = rowByID(el.dataset.keepEnd);
    if (!row) return;
    row.inferred = row.inferred.filter((i) => i.field !== 'end');
    row.checked = true;
    regrade(row);
    repaint();
  });
  delegate(root, '[data-clear-end]', (el) => {
    const row = rowByID(el.dataset.clearEnd);
    if (!row) return;
    row.endTime = '';
    row.inferred = row.inferred.filter((i) => i.field !== 'end');
    row.checked = true;
    regrade(row);
    repaint();
  });

  delegate(root, '[data-move]', (el) => {
    const row = rowByID(el.dataset.move);
    if (!row) return;
    row.dayNumber = Number(el.dataset.to);
    row.dayGuessed = false;
    row.inferred = row.inferred.filter((i) => i.field !== 'day');
    regrade(row);
    repaint();
  });
  delegate(root, '[data-move-rest]', (el) => {
    // A wrong day boundary is usually wrong for everything under it too.
    const at = read.rows.findIndex((r) => r.id === el.dataset.moveRest);
    if (at < 0) return;
    const from = read.rows[at].dayNumber;
    const to = from + 1;
    for (const row of read.rows.slice(at)) {
      if (row.dayNumber !== from) continue;
      row.dayNumber = to;
      row.dayGuessed = false;
      row.inferred = row.inferred.filter((i) => i.field !== 'day');
      regrade(row);
    }
    repaint();
  });

  delegate(root, '[data-split]', (el) => {
    const at = read.rows.findIndex((r) => r.id === el.dataset.split);
    const row = read.rows[at];
    if (!row) return;
    const parts = row.name.split(/\s+(?:&|and)\s+/i).map((t) => t.trim()).filter(Boolean);
    if (parts.length < 2) return;
    row.name = parts[0];
    row.splittable = false;
    const extras = parts.slice(1).map((name, i) => ({
      ...row,
      id: `${row.id}-s${i}`,
      name,
      splittable: false,
      checked: false,
      note: '',
    }));
    read.rows.splice(at + 1, 0, ...extras);
    repaint();
  });

  delegate(root, '[data-make-stop]', (el) => {
    const row = rowByID(el.dataset.makeStop);
    if (!row) return;
    row.kind = 'stop';
    row.inferred = [{ field: 'time', text: 'No time on the line — set one, or leave it' }];
    regrade(row);
    openRow = row.id;
    repaint();
  });
  delegate(root, '[data-append]', (el) => {
    const at = read.rows.findIndex((r) => r.id === el.dataset.append);
    const above = read.rows.slice(0, at).reverse().find((r) => r.kind === 'stop');
    if (!above) return;
    above.note = above.note ? `${above.note} ${read.rows[at].name}` : read.rows[at].name;
    read.rows.splice(at, 1);
    repaint();
  });
}

// ---------------------------------------------------------------- one row

function rowView() {
  const row = rowByID(openRow);
  if (!row) return reviewView();
  const at = read.rows.findIndex((r) => r.id === row.id);
  const dayCount = Math.max(state.trip?.dayCount || 1, ...read.rows.map((r) => r.dayNumber));
  const endGuess = row.inferred.find((i) => i.field === 'end');

  return html`
    <section class="screen">
      <div class="head">
        <div class="head-row center">
          <button class="iconbtn" data-act="row-close" aria-label="Back to the rows">${raw(icon.back)}</button>
          <div class="grow">
            <div class="push-title">Row ${at + 1} of ${read.rows.length}</div>
            <div class="push-sub">Day ${row.dayNumber}${read.titles.get(row.dayNumber) ? ` · ${read.titles.get(row.dayNumber)}` : ''}</div>
          </div>
        </div>
      </div>

      <div class="scroll" style="padding:14px 16px 24px">
        <div class="cand-raw">${row.raw || row.name}</div>
        <div class="f11 soft lh145 mt6">Your line, kept as pasted.</div>

        <div class="col g10 mt14">
          <label>
            <div class="eyebrow">NAME</div>
            <input id="row-name" class="mt4" style="width:100%" value="${row.name}">
          </label>

          <div class="row g8">
            <label class="grow">
              <div class="eyebrow">STARTS</div>
              <input id="row-start" class="mt4" style="width:100%" value="${row.time}"
                     placeholder="--:--" inputmode="numeric">
            </label>
            <label class="grow">
              <div class="eyebrow"${endGuess ? ' style="color:var(--amber-fg)"' : ''}>ENDS</div>
              <input id="row-end" class="mt4${endGuess ? ' guessed' : ''}" style="width:100%"
                     value="${row.endTime}" placeholder="—" inputmode="numeric">
              ${endGuess ? html`<div class="f11 w650 mt2" style="color:var(--amber-fg)">${endGuess.text}</div>` : ''}
            </label>
          </div>

          <label>
            <div class="eyebrow">NOTE</div>
            <input id="row-note" class="mt4" style="width:100%" value="${row.note}"
                   placeholder="Anything else the line said">
          </label>

          <div>
            <div class="eyebrow">WHICH DAY</div>
            <div class="row g6 wrap mt6">
              ${Array.from({ length: dayCount }, (_, i) => i + 1).map((n) => html`
                <button class="note-day${n === row.dayNumber ? ' on' : ''}" data-row-day="${n}">D${n}</button>`)}
            </div>
          </div>

          <div>
            <div class="row g8 center">
              <div class="grow eyebrow">MAP LINK</div>
              <div class="f11 w650 soft">optional</div>
            </div>
            <input id="row-link" class="mt4" style="width:100%" value="${row.link || ''}"
                   placeholder="Paste a Google or Apple Maps link">
            <div class="f11 soft lh145 mt4">
              The link is what gives the stop a position. Leave it and the stop still saves — it
              just has no pin until you add one from the stop itself.
            </div>
          </div>
        </div>

        <div class="row g8 mt16">
          <button class="btn jade grow" data-act="row-save">Confirm and next</button>
          <button class="btn none" style="width:96px;background:var(--danger-bg);color:var(--danger-fg)"
                  data-act="row-skip">Skip row</button>
        </div>
        <div class="f11 soft lh145 mt10">
          Skipped rows stay in the list, greyed, so you can change your mind before the summary.
        </div>
      </div>
    </section>`;
}

function mountRow(root) {
  const row = rowByID(openRow);
  const close = () => { openRow = null; repaint(); };

  delegate(root, '[data-act="row-close"]', close);
  delegate(root, '[data-row-day]', (el) => {
    if (!row) return;
    row.dayNumber = Number(el.dataset.rowDay);
    row.dayGuessed = false;
    row.inferred = row.inferred.filter((i) => i.field !== 'day');
    regrade(row);
    repaint();
  });

  const commit = () => {
    if (!row) return;
    row.name = root.querySelector('#row-name')?.value.trim() || row.name;
    row.note = root.querySelector('#row-note')?.value.trim() || '';
    row.link = root.querySelector('#row-link')?.value.trim() || '';

    const start = root.querySelector('#row-start')?.value.trim() || '';
    const end = root.querySelector('#row-end')?.value.trim() || '';
    const startAt = parseClock(start);
    const endAt = parseClock(end);
    row.time = startAt != null ? clock(startAt) : '';
    row.endTime = endAt != null ? clock(endAt) : '';
    // Anything typed by hand is no longer inferred.
    row.inferred = row.inferred.filter((i) => i.field !== 'end' && i.field !== 'time');
    if (!row.time) row.inferred.push({ field: 'time', text: 'No time on the line — set one, or leave it' });
    regrade(row);
  };

  delegate(root, '[data-act="row-save"]', () => {
    commit();
    if (row) {
      row.checked = true;
      row.skipped = false;
      row.splittable = false;
    }
    // Straight on to the next thing still outstanding.
    const next = outstanding()[0];
    openRow = next ? next.id : null;
    repaint();
  });

  delegate(root, '[data-act="row-skip"]', () => {
    if (row) {
      row.skipped = true;
      row.checked = false;
    }
    close();
  });
}

// ------------------------------------------------------------------ summary

function summaryView() {
  const rows = wanted();
  const skipped = read.rows.filter((r) => r.skipped).length;
  const fixed = read.rows.filter((r) => r.grade === 'read' && r.raw && r.checked).length;
  const days = [...new Set(rows.map((r) => r.dayNumber))].sort((a, b) => a - b);
  const unlocated = rows.filter((r) => !r.link).length;

  return html`
    <section class="screen">
      ${backHeader({
        title: 'Ready to save',
        sub: `All ${read.rows.length} rows checked · nothing written yet`,
      })}

      <div class="scroll" style="padding:14px 16px 24px">
        <div class="card pad mb12">
          <div class="eyebrow">WHAT WILL BE CREATED</div>
          <div class="row g10 mt4" style="align-items:flex-end">
            <div class="grow" style="font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1">${rows.length}</div>
            <div class="right none">
              <div class="f11 w800 soft">ACROSS</div>
              <div class="f13 w700">${days.length} day${days.length === 1 ? '' : 's'}</div>
            </div>
          </div>
          <div class="f12 muted mt8">
            ${rows.length} stop${rows.length === 1 ? '' : 's'} confirmed ·
            ${skipped} row${skipped === 1 ? '' : 's'} skipped ·
            ${fixed} fixed by hand
          </div>
        </div>

        <div class="card-list mb12">
          <div class="pad16 eyebrow" style="padding-top:11px;padding-bottom:11px">DAY BY DAY</div>
          ${days.map((n) => {
            const mine = rows.filter((r) => r.dayNumber === n);
            const times = mine.map((r) => parseClock(r.time)).filter((t) => t != null).sort((a, b) => a - b);
            const ends = mine.map((r) => parseClock(r.endTime)).filter((t) => t != null).sort((a, b) => a - b);
            const span = times.length
              ? `${clock(times[0])} – ${clock(ends.length ? Math.max(ends[ends.length - 1], times[times.length - 1]) : times[times.length - 1])}`
              : 'no times';
            return html`
              <div class="row g10 row-divider" style="padding:10px 14px;align-items:baseline">
                <div class="none f125 w700" style="width:52px">Day ${n}</div>
                <div class="grow f12" style="color:var(--charcoal)">
                  ${mine.length} stop${mine.length === 1 ? '' : 's'} · ${span}
                </div>
                <div class="f11 w650 soft">${store.day(n)?.shortDate || ''}</div>
              </div>`;
          })}
        </div>

        <div class="caveat mb12">
          <div class="eyebrow amber">TWO THINGS IT DID NOT DO</div>
          <div class="f12 lh15 w650 mt6">
            ${unlocated} of the ${rows.length} stops have no position yet, so they will not appear
            on the map until you paste a link into them.
          </div>
          <div class="f12 lh15 w650 mt6">
            No sub routes were created. Free time is yours to declare, in the gaps this leaves.
          </div>
        </div>

        ${busy ? html`<div class="amber-note f12 mb12">${busy}</div>` : ''}

        <button class="btn jade" style="width:100%;height:48px" data-act="save"${busy ? ' disabled' : ''}>
          Save ${rows.length} stop${rows.length === 1 ? '' : 's'} to the trip
        </button>
        <button class="btn ghost mt8" style="width:100%" data-act="back-to-rows">Back to the rows</button>
        ${existingNote(days)}
      </div>
    </section>`;
}

/** Importing into a day that already has stops adds to it, and says so. */
function existingNote(days) {
  const busiest = days
    .map((n) => ({ n, count: store.activeItems(store.day(n)).length }))
    .filter((d) => d.count)
    .sort((a, b) => b.count - a.count)[0];
  if (!busiest) return '';
  return html`
    <div class="f11 soft lh145 mt10" style="text-align:center">
      Day ${busiest.n} already has ${busiest.count} stop${busiest.count === 1 ? '' : 's'} from earlier.
      Its new ones are added alongside, not over them.
    </div>`;
}

function mountSummary(root) {
  delegate(root, '[data-act="back"]', () => { phase = 'review'; repaint(); });
  delegate(root, '[data-act="back-to-rows"]', () => { phase = 'review'; repaint(); });
  delegate(root, '[data-act="save"]', async () => {
    busy = 'Adding them to the trip…';
    repaint();
    result = await store.importItinerary(
      wanted().map((row) => ({ ...row, include: true })),
      { sourceText: read.text },
    );
    busy = '';
    phase = 'done';
    repaint();
  });
}

// --------------------------------------------------------------------- done

function doneView() {
  const added = result?.added || 0;
  return html`
    <section class="screen">
      ${backHeader({ title: 'Saved', sub: `${added} stop${added === 1 ? '' : 's'} on your itinerary` })}
      <div class="scroll" style="padding:14px 16px 24px">
        <div class="card pad">
          <div class="eyebrow jade">DONE</div>
          <div class="f125 lh155 mt8" style="color:var(--charcoal)">
            ${added} stop${added === 1 ? '' : 's'} saved from your itinerary.
            ${result?.placesMade ? `${result.placesMade} new place${result.placesMade === 1 ? '' : 's'} were created for them` : ''}${result?.reused ? `, and ${result.reused} matched somewhere you had already saved` : ''}.
            ${result?.lengthened ? `The trip was lengthened by ${result.lengthened} day${result.lengthened === 1 ? '' : 's'} to fit.` : ''}
          </div>
          <div class="f115 lh145 mt10 muted">
            ${result?.unlocated || 0} still need a position, so they will not appear on the map
            until you open one and paste its map link. Everything else — times, notes, shopping,
            must-see shots — works on them straight away.
          </div>
          <button class="btn jade mt14" data-act="plan">Open the Plan</button>
        </div>

        <div class="f11 soft lh145 mt12">
          There is no undo, but the text you pasted is kept with the trip: paste again and it is
          waiting under <b>Last import</b>. Anything wrong is edited stop by stop, and a stop on
          the wrong day can be dragged or moved in Plan's edit mode.
        </div>
      </div>
    </section>`;
}

// -------------------------------------------------------------------- helpers

const rowByID = (id) => read?.rows.find((r) => r.id === id) || null;

function minutesOf(row) {
  const from = parseClock(row.time);
  const to = parseClock(row.endTime);
  if (from == null || to == null) return 0;
  return to >= from ? to - from : (to + 1440) - from;
}

/** A row that has been corrected by hand is no longer "worked out". */
function regrade(row) {
  if (row.kind === 'unread') return;
  row.grade = row.inferred.length ? 'worked' : 'read';
}

function repaint() {
  // Through the store, so the paint keeps this screen's scroll position.
  store.selectDay(state.selectedDay);
}

function reset() {
  phase = 'paste';
  text = '';
  read = null;
  openRow = null;
  result = null;
  busy = '';
}
