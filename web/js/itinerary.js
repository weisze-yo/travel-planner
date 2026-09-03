// Reading a pasted itinerary, item 01.
//
// No paid API and no server, so this happens on the device: text in,
// candidate stops out, and every row correctable before any of it lands.
//
// The design constraint that shapes all of it is that the half-understood row
// is the normal one. An agent's PDF gives you "Day 3" once and then eight
// lines of varying shape; a WhatsApp message gives you no days at all. So a
// row that is missing its day or its time is kept and flagged, never dropped,
// and every field on it can be corrected on the confirm screen.

import { parseClock, parseDuration, uid } from './util.js';

const CN_NUMERALS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Lines that are furniture rather than itinerary. */
const NOISE = /^(itinerary|schedule|programme?|tour|day|days|notes?|remarks?|行程(表|安排)?|日程(表)?|备注|備註)\s*[:：]?$/i;

/** A time, in the shapes people write them. Returns minutes past midnight. */
function readTime(text) {
  const raw = String(text || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!raw) return null;

  const hit = /^(?:上午|下午|早上|晚上)?(\d{1,2})(?:[:.：h](\d{2}))?(am|pm)?$/.exec(raw);
  if (!hit) return null;

  let hours = Number(hit[1]);
  const minutes = hit[2] ? Number(hit[2]) : 0;
  if (hours > 23 || minutes > 59) return null;

  if (hit[3] === 'pm' && hours < 12) hours += 12;
  if (hit[3] === 'am' && hours === 12) hours = 0;
  // 下午/晚上 3:00 is 15:00.
  if (/^(下午|晚上)/.test(raw) && hours < 12) hours += 12;

  // A bare hour with no minutes and no am/pm is only a time when it was
  // written as one — "9" on its own is far more often a list number.
  if (!hit[2] && !hit[3] && !/^(上午|下午|早上|晚上)/.test(raw)) return null;

  return hours * 60 + minutes;
}

const TIME_TOKEN = '(?:上午|下午|早上|晚上)?\\d{1,2}(?:[:.：h]\\d{2})?(?:\\s*[ap]m)?';
const RANGE_GAP = '\\s*(?:[-–—~]|to|till|until|至|~)\\s*';

const RANGE_RE = new RegExp(`(${TIME_TOKEN})${RANGE_GAP}(${TIME_TOKEN})`, 'i');
const SINGLE_RE = new RegExp(`(${TIME_TOKEN})`, 'i');
const HHMM_RANGE_RE = /\b(\d{4})\s*[-–—~]\s*(\d{4})\b/;

/** "Day 3", "DAY 3 —", "D3:", "第三天", "第 3 天". */
function readDayHeader(line) {
  const cn = /^第\s*([0-9一二三四五六七八九十]+)\s*天/.exec(line);
  if (cn) {
    const token = cn[1];
    const n = /^\d+$/.test(token) ? Number(token) : CN_NUMERALS[token];
    if (n) return { dayNumber: n, rest: line.slice(cn[0].length) };
  }
  const en = /^(?:day|dia|jour)\s*[#]?\s*(\d{1,2})\b/i.exec(line);
  if (en) return { dayNumber: Number(en[1]), rest: line.slice(en[0].length) };

  const short = /^d\s*(\d{1,2})\s*[:：.\-–—]/i.exec(line);
  if (short) return { dayNumber: Number(short[1]), rest: line.slice(short[0].length) };

  return null;
}

/** A date line, turned into a day number against the trip's first day. */
function readDate(line, startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})\b/.exec(line);
  const named = /^(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.exec(line)
    || /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*(\d{1,2})\b/i.exec(line);
  const slash = /^(\d{1,2})[/](\d{1,2})(?![/\d])/.exec(line);

  let date = null;
  let used = 0;
  if (iso) {
    date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    used = iso[0].length;
  } else if (named) {
    const isDayFirst = /^\d/.test(named[0]);
    const month = MONTHS[(isDayFirst ? named[2] : named[1]).slice(0, 3).toLowerCase()];
    const dayOfMonth = Number(isDayFirst ? named[1] : named[2]);
    if (month === undefined || !dayOfMonth) return null;
    date = new Date(start.getFullYear(), month, dayOfMonth);
    used = named[0].length;
  } else if (slash) {
    // Day/month, the way it is written everywhere except the United States.
    date = new Date(start.getFullYear(), Number(slash[2]) - 1, Number(slash[1]));
    used = slash[0].length;
  }
  if (!date || Number.isNaN(date.getTime())) return null;

  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const offset = Math.round((date - startMidnight) / 86400000);
  if (offset < 0 || offset > 60) return null;
  return { dayNumber: offset + 1, rest: line.slice(used) };
}

/** A duration written beside the stop: "(45 min)", "1h", "约2小时". */
function readDuration(line) {
  const bracketed = /[([（【]\s*(?:约|approx\.?|about\s*)?(\d+(?:\.\d+)?\s*(?:h|hr|hrs|hour|hours|m|min|mins|minute|minutes|小时|分钟)(?:\s*\d{1,2}\s*(?:m|min|mins)?)?)\s*[)\]）】]/i.exec(line);
  if (bracketed) {
    const minutes = parseDuration(bracketed[1]);
    if (minutes) return { minutes, used: bracketed[0] };
  }
  const bare = /(?:^|\s)(?:约|for\s+|about\s+)?(\d+(?:\.\d+)?\s*(?:h|hrs?|hours?|mins?|minutes?|小时|分钟))(?=$|[\s,.;·])/i.exec(line);
  if (bare) {
    const minutes = parseDuration(bare[1]);
    if (minutes) return { minutes, used: bare[1] };
  }
  return null;
}

/** Strips bullets, numbering and leftover punctuation off a candidate name. */
function cleanName(text) {
  return String(text || '')
    .replace(/^[\s\-–—:：·•*>»~|]+/, '')
    .replace(/^\d{1,2}\s*[.)]\s+/, '')
    .replace(/[\s\-–—:：·•*|,;]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** A line that continues the one above it rather than starting a new stop. */
function looksLikeContinuation(line) {
  if (/^[([（"'“]/.test(line)) return true;
  if (/^(?:note|notes|nb|includes?|incl\.?|meal|meals|lunch|dinner|breakfast|guide|pickup|pick-up|driver|hotel|remark)s?\s*[:：]/i.test(line)) return true;
  // A line opening in lower case is a sentence carrying on, not a new stop.
  const first = cleanName(line).charAt(0);
  return Boolean(first) && first === first.toLowerCase() && /[a-z]/.test(first);
}

/**
 * Reads pasted text into candidate stops.
 *
 * @param {string} text  whatever was pasted
 * @param {{startDate?: string, dayCount?: number}} trip
 */
export function parseItinerary(text, { startDate = null, dayCount = 0 } = {}) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const rows = [];
  let currentDay = null;
  let sawAnyHeader = false;
  const titles = new Map();
  let skipped = 0;
  let previous = null;

  const push = (dayNumber, { time, minutes, name }) => {
    const guessed = dayNumber == null;
    const row = {
      id: uid('cand-'),
      dayNumber: dayNumber ?? 1,
      dayGuessed: guessed,
      time: time == null ? '' : `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`,
      durationMinutes: minutes || null,
      name,
      note: '',
      include: true,
      issues: [],
    };
    if (!row.time) row.issues.push('No time — set one, or leave it and fix it on the day');
    if (guessed) row.issues.push('No day was given above this line, so it is on day 1');
    if (name.length > 70) row.issues.push('That is a long name — it may be two stops on one line');
    if (dayCount && row.dayNumber > dayCount) {
      row.issues.push(`Day ${row.dayNumber} is past the end of this trip — the trip will be lengthened`);
    }
    rows.push(row);
    previous = row;
    return row;
  };

  for (const original of lines) {
    const line = original.trim();
    if (!line) {
      previous = null;
      continue;
    }

    // A day header, on its own or with the first stop trailing behind it.
    const header = readDayHeader(line) || readDate(line, startDate);
    if (header) {
      currentDay = header.dayNumber;
      sawAnyHeader = true;
      previous = null;
      const rest = cleanName(header.rest);
      if (!rest || NOISE.test(rest)) continue;
      // "Day 3 — Old Quarter" names the day; "Day 3: 08:30 Depart" starts it.
      // Trailing text with no time in it is a title, so it is left out rather
      // than becoming a stop nobody asked for.
      if (SINGLE_RE.test(rest) || HHMM_RANGE_RE.test(rest)) readStop(rest, currentDay);
      else titles.set(currentDay, rest);
      continue;
    }

    if (NOISE.test(line)) {
      skipped += 1;
      continue;
    }

    readStop(line, currentDay);
  }

  function readStop(line, dayNumber) {
    let working = line;
    let time = null;
    let end = null;

    const compact = HHMM_RANGE_RE.exec(working);
    const range = compact ? null : RANGE_RE.exec(working);

    if (compact) {
      time = parseClock(`${compact[1].slice(0, 2)}:${compact[1].slice(2)}`);
      end = parseClock(`${compact[2].slice(0, 2)}:${compact[2].slice(2)}`);
      working = working.replace(compact[0], ' ');
    } else if (range && readTime(range[1]) != null && readTime(range[2]) != null) {
      time = readTime(range[1]);
      end = readTime(range[2]);
      working = working.replace(range[0], ' ');
    } else {
      const single = SINGLE_RE.exec(working);
      if (single && readTime(single[1]) != null) {
        time = readTime(single[1]);
        working = working.replace(single[0], ' ');
      }
    }

    let minutes = end != null && time != null ? ((end - time) + 1440) % 1440 : null;
    if (!minutes) {
      const read = readDuration(working);
      if (read) {
        minutes = read.minutes;
        working = working.replace(read.used, ' ');
      }
    }

    const name = cleanName(working);

    // Nothing but a time, or nothing at all.
    if (!name || name.length < 2) {
      skipped += 1;
      return;
    }

    // No time and reading like prose: this belongs to the stop above it.
    if (time == null && previous && looksLikeContinuation(line)) {
      previous.note = previous.note ? `${previous.note} ${name}` : name;
      return;
    }

    push(dayNumber, { time, minutes, name });
  }

  const days = [...new Set(rows.map((r) => r.dayNumber))].sort((a, b) => a - b);
  return {
    rows,
    days,
    titles,
    skipped,
    sawAnyHeader,
    needsAttention: rows.filter((r) => r.issues.length).length,
  };
}
