// §3.7 — THE NEARBY TAB AS THE MANAGING SURFACE. THE LARGEST SECTION.
//
// The report: "change 'manage places for this stop' to 'add a place' and
// the sub route card to dark and its position like how it was after enter
// 'manage places for this stop' ... please handle also case if there are
// more than 1 sub route ... than change the tick/checkbox to a dropdown of
// subroute name created, so a place will be added in the subroute if the
// sub route name chose for the place, else leave empty."
//
// Five parts, all gated here:
//
//   1  the TAB manages places: filter, add, categorise, delete, assign
//   2  it keeps ONE control, a category select; sort leaves for the day-wide
//      screen, where a list spanning stops makes travel time mean something
//   3  the round + / ✓ and the DOCK both die; a per-card sub-route select
//      replaces them and says WHICH loop
//   4  the day's sub routes are a READ-ONLY dark card at the foot whose only
//      action is a way to the Plan
//   5  the tab lists EVERY row — no cap, no counted doorway
//
// F5 (b) is the decision underneath it: MEMBERSHIP IS SINGULAR. `alsoIn` and
// its "in ‹loop›" chips are gone from both surfaces, `toggleSubRoutePlace`
// became `setSubRoutePlace` — a set, with the loop named rather than
// inferred from "the loop in hand" — and a migration keeps the
// earliest-departing loop for any place currently in several. All four are
// driven through the real select here, including that choosing a second loop
// MOVES the place rather than adding it, which is the property a toggle
// could not have.
//
// The removals are asserted as ABSENCES on both surfaces, because §3.7's
// risk is not that the new controls fail — it is that the old ones survive
// beside them and the screen ends up with two ways to do one thing. And the
// route check at the end is the one that keeps the two surfaces from
// drifting back into overlap: exactly one `go('nearby')` may remain in the
// app, and it must be the day.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

const APP = 'http://127.0.0.1:8099';
const pass = [], fail = [];
const check = (n, ok, extra = '') => {
  (ok ? pass : fail).push(n);
  console.log((ok ? '  ok  ' : '  FAIL ') + n + (extra ? ` — ${String(extra).slice(0, 300)}` : ''));
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({
  viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, serviceWorkers: 'block',
});
await ctx.addInitScript(() => {
  if (!localStorage.getItem('travel-planner:active-trip')) {
    localStorage.setItem('travel-planner:active-trip', 'meridian-city');
  }
});
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
await page.goto(APP + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#boot')?.classList.contains('gone') ?? true, { timeout: 40000 });
await page.waitForTimeout(700);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
});
const go = async (s, a) => {
  await page.evaluate(([x, y]) => window.__nav.go(x, y), [s, a]);
  await page.waitForTimeout(430);
};

{

  const target = await page.evaluate(() => {
    const s = window.__store;
    const byAnchor = new Map();
    for (const p of s.state.places) {
      if (p.anchorPlaceID) byAnchor.set(p.anchorPlaceID, (byAnchor.get(p.anchorPlaceID) || 0) + 1);
    }
    let best = null;
    for (const d of (s.state.days || [])) {
      for (const it of (d.items || [])) {
        if (!it?.placeID) continue;
        const n = byAnchor.get(it.placeID) || 0;
        if (!best || n > best.n) best = { itemID: it.id, placeID: it.placeID, n, day: d.dayNumber };
      }
    }
    return best;
  });
  const openTab = async () => {
    await go('dest', { itemID: target.itemID });
    await page.evaluate(() => document.querySelector('[data-panel="nearby"]')?.click());
    await page.waitForTimeout(550);
  };

  // Give the day a SECOND loop, so "moves between loops" is testable and the
  // dark foot card has more than one row.
  await page.evaluate((day) => {
    const s = window.__store;
    if (s.subRoutesFor(day).length < 2) {
      s.addSubRoute(day, { name: 'Evening lamps loop', depart: '17:40', returnBy: '19:30' });
    }
    s.touch();
  }, target.day);
  await openTab();

  // ============================================= 1 · what is REMOVED
  const gone = await page.evaluate(() => {
    const scroll = document.querySelector('.scroll');
    return {
      round: document.querySelectorAll('.nearby-add').length,
      pick: document.querySelectorAll('[data-pick]').length,
      dock: document.querySelectorAll('.dock, .dock-btn, .dock-loops').length,
      manage: /Manage places for this stop/.test(scroll.textContent),
      sortInTab: document.querySelectorAll('.sortbtn, [data-act="sort-toggle"]').length,
      alsoIn: document.querySelectorAll('.leg-in').length,
      doorway: /All \d+ places →|places around this stop/.test(scroll.textContent),
    };
  });
  console.log('  removed:', JSON.stringify(gone));
  check('§3.7 · the round + / ✓ is gone from every card', gone.round === 0 && gone.pick === 0,
        `${gone.round} / ${gone.pick}`);
  check('§3.7 · the fixed bottom dock is gone', gone.dock === 0, gone.dock);
  check('§3.7 · "Manage places for this stop" is gone as a doorway', gone.manage === false);
  check('§3.7 · sort has left the tab', gone.sortInTab === 0, gone.sortInTab);
  check('§3.7 · F5(b) · the "in ‹loop›" chips are gone', gone.alsoIn === 0, gone.alsoIn);
  check('§3.7 · and the counted doorway never ships', gone.doorway === false);

  // ============================================= 2 · ONE control row
  const control = await page.evaluate(() => {
    const sel = document.querySelector('[data-act="cat-pick"]');
    const chip = sel?.closest('.sel-chip');
    return {
      sel: Boolean(sel),
      options: [...(sel?.options || [])].map((o) => [o.value, o.textContent.trim()]),
      chipH: chip && Math.round(chip.getBoundingClientRect().height),
      chips: document.querySelectorAll('.chiprow .cat').length,
      count: sel?.closest('.row')?.querySelector('.grow')?.textContent.trim().replace(/\s+/g, ' '),
      cards: document.querySelectorAll('.nearby-card').length,
    };
  });
  console.log('  control:', JSON.stringify(control));
  check('§3.7 · one control: a category select', control.sel === true);
  check('§3.7 · on §3.5’s 26px inline recipe', control.chipH === 26, control.chipH);
  check('§3.7 · NOT a chip row — four nested scroll surfaces was the rejection',
        control.chips === 0, control.chips);
  check('§3.7 · it offers only the categories PRESENT, each with its count',
        control.options.length > 1 && control.options[0][0] === 'all'
          && control.options.slice(1).every(([, t]) => /\s\d+$/.test(t)),
        JSON.stringify(control.options));
  check('§3.7 · and it derives from CATEGORY_LABELS, so a new value cannot be missed',
        control.options.slice(1).every(([v]) => v && v !== 'all'), JSON.stringify(control.options.map((o) => o[0])));

  const filtered = await page.evaluate(async () => {
    const sel = document.querySelector('[data-act="cat-pick"]');
    const pick = [...sel.options].find((o) => o.value !== 'all' && /\s[1-9]\d*$/.test(o.textContent));
    const want = Number(pick.textContent.trim().match(/(\d+)$/)[1]);
    sel.value = pick.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 550));
    return {
      want, cat: pick.value,
      cards: document.querySelectorAll('.nearby-card').length,
      count: document.querySelector('[data-act="cat-pick"]')?.closest('.row')?.querySelector('.grow')?.textContent.trim(),
      stillSelected: document.querySelector('[data-act="cat-pick"]')?.value,
    };
  });
  console.log('  filtered:', JSON.stringify(filtered));
  check('§3.7 · picking a category really filters to its own count',
        filtered.cards === filtered.want, `${filtered.cards} vs ${filtered.want}`);
  check('§3.7 · the head says N of M', /^\d+ of \d+$/.test(filtered.count || ''), filtered.count);
  check('§3.7 · and the select keeps its own value across the repaint',
        filtered.stillSelected === filtered.cat, `${filtered.stillSelected} vs ${filtered.cat}`);
  await openTab();

  // ============================================= 3 · the sub-route select
  const sel = await page.evaluate(() => {
    const first = document.querySelector('[data-loop-for]');
    const chip = first.closest('.sel-chip');
    const cs = getComputedStyle(chip);
    return {
      n: document.querySelectorAll('[data-loop-for]').length,
      cards: document.querySelectorAll('.nearby-card').length,
      first: [...first.options].map((o) => [o.value, o.textContent.trim()]),
      value: first.value,
      chipH: Math.round(chip.getBoundingClientRect().height),
      restBg: cs.backgroundColor,
      restFg: getComputedStyle(first).color,
      // it sits on the card's second chip line, before Edit
      order: [...first.closest('.row').children].map((c) => c.className.split(' ')[0]),
    };
  });
  console.log('  select:', JSON.stringify(sel));
  check('§3.7 · one select per card, no card missed',
        sel.n === sel.cards && sel.n > 0, `${sel.n} / ${sel.cards}`);
  check('§3.7 · "Saved only" is the empty option — a real answer, not a dash',
        sel.first[0][1] === 'Saved only' && sel.first[0][0] === '', JSON.stringify(sel.first[0]));
  check('§3.7 · and the day’s loops are the rest', sel.first.length >= 3, JSON.stringify(sel.first));
  check('§3.7 · at rest it is §3.5’s grey chip, 26px',
        sel.chipH === 26 && sel.restBg === 'rgb(239, 241, 238)', `${sel.chipH} ${sel.restBg}`);
  check('§3.7 · it is first on the card’s second chip line', sel.order[0] === 'sel-chip', JSON.stringify(sel.order));

  // ---- choosing a loop, then MOVING it, then clearing -------------------
  const flow = await page.evaluate(async () => {
    const s = window.__store;
    const el = () => document.querySelector('[data-loop-for]');
    const id = el().dataset.loopFor;
    const day = Number(el().dataset.day);
    const loops = s.subRoutesFor(day);
    const pick = async (value) => {
      const n = el();
      n.value = value;
      n.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 500));
    };
    const holders = () => s.subRoutesFor(day).filter((l) => (l.placeIDs || []).includes(id)).map((l) => l.name);
    const chipState = () => {
      const chip = el().closest('.sel-chip');
      return {
        mine: chip.classList.contains('mine'),
        bg: getComputedStyle(chip).backgroundColor,
        fg: getComputedStyle(el()).color,
        picked: el().closest('.nearby-card').classList.contains('picked'),
      };
    };
    await pick(loops[0].id);
    const first = { holders: holders(), chip: chipState(), value: el().value };
    await pick(loops[1].id);
    const second = { holders: holders(), value: el().value };
    await pick('');
    const cleared = { holders: holders(), chip: chipState(), value: el().value };
    return { loops: loops.map((l) => l.name), first, second, cleared };
  });
  console.log('  flow:', JSON.stringify(flow));
  check('§3.7 · choosing a loop puts the place in exactly that one',
        flow.first.holders.length === 1 && flow.first.holders[0] === flow.loops[0],
        JSON.stringify(flow.first.holders));
  check('§3.7 · the chip turns AMBER — already "a sub route, planned by you"',
        flow.first.chip.mine === true && flow.first.chip.bg === 'rgb(251, 241, 222)'
          && flow.first.chip.fg === 'rgb(138, 90, 8)', JSON.stringify(flow.first.chip));
  check('§3.7 · and the card keeps its amber border, so membership reads without the chip',
        flow.first.chip.picked === true);
  check('§3.7 · F5(b) · choosing a SECOND loop MOVES it — never both',
        flow.second.holders.length === 1 && flow.second.holders[0] === flow.loops[1],
        JSON.stringify(flow.second.holders));
  check('§3.7 · "Saved only" takes it out of every loop on the day',
        flow.cleared.holders.length === 0, JSON.stringify(flow.cleared.holders));
  check('§3.7 · and the chip goes back to grey',
        flow.cleared.chip.mine === false && flow.cleared.chip.picked === false,
        JSON.stringify(flow.cleared.chip));

  // ============================================= 4 · the dark foot card
  const foot = await page.evaluate(() => {
    const card = document.querySelector('.loop-foot');
    if (!card) return { missing: true };
    const cs = getComputedStyle(card);
    return {
      bg: cs.backgroundColor,
      eyebrow: card.querySelector('.eyebrow')?.textContent.trim(),
      rows: [...card.querySelectorAll('.loop-foot-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()),
      note: card.querySelector('.loop-foot-note')?.textContent.trim(),
      go: card.querySelector('.loop-foot-go')?.textContent.trim(),
      // read-only: no drag handles, no editable field, no delete
      handles: card.querySelectorAll('[data-grip], input, select, [data-swipe-delete]').length,
      actions: card.querySelectorAll('button').length,
      nameColour: getComputedStyle(card.querySelector('.loop-foot-name')).color,
      secondColour: getComputedStyle(card.querySelector('.loop-foot-note')).color,
    };
  });
  console.log('  foot:', JSON.stringify(foot));
  check('§3.7 · the day’s sub routes are a dark card at the foot',
        foot.bg === 'rgb(61, 76, 70)', foot.bg);
  check('§3.7 · headed FREE TIME ON DAY N', /^FREE TIME ON DAY \d+$/.test(foot.eyebrow || ''), foot.eyebrow);
  check('§3.7 · one row per loop, with its time and its count',
        foot.rows.length >= 2 && foot.rows.every((r) => /^\d{2}:\d{2} .+ \d+ places?$/.test(r)),
        JSON.stringify(foot.rows));
  check('§3.7 · READ-ONLY — no handles, no fields, no deletes',
        foot.handles === 0, foot.handles);
  check('§3.7 · exactly ONE action, and it is the way to the Plan',
        foot.actions === 1 && foot.go === 'Open Plan', `${foot.actions} / ${foot.go}`);
  check('§3.7 · and it says where arranging happens',
        /Arranging and timing them happens on the Plan\./.test(foot.note || ''), foot.note);
  check('§3.7 · its inks are F4’s pair, not a third grey',
        foot.nameColour === 'rgb(228, 235, 232)' && foot.secondColour === 'rgb(182, 199, 192)',
        `${foot.nameColour} / ${foot.secondColour}`);

  const wentToPlan = await page.evaluate(async () => {
    document.querySelector('.loop-foot-go').click();
    await new Promise((r) => setTimeout(r, 600));
    return location.hash;
  });
  check('§3.7 · Open Plan really goes to the Plan', wentToPlan === '#plan', wentToPlan);
}

// ----------------------------------------------------------------------
{

  const target = await page.evaluate(() => {
    const s = window.__store;
    const byAnchor = new Map();
    for (const p of s.state.places) {
      if (p.anchorPlaceID) byAnchor.set(p.anchorPlaceID, (byAnchor.get(p.anchorPlaceID) || 0) + 1);
    }
    let best = null;
    for (const d of (s.state.days || [])) {
      for (const it of (d.items || [])) {
        if (!it?.placeID) continue;
        const n = byAnchor.get(it.placeID) || 0;
        if (!best || n > best.n) best = { itemID: it.id, placeID: it.placeID, n, day: d.dayNumber };
      }
    }
    return best;
  });
  const openTab = async () => {
    await go('dest', { itemID: target.itemID });
    await page.evaluate(() => document.querySelector('[data-panel="nearby"]')?.click());
    await page.waitForTimeout(550);
  };

  // ============================ 1 · a day with NO sub routes at all
  const bare = await page.evaluate(async (day) => {
    const s = window.__store;
    const held = s.subRoutesFor(day).map((l) => l.id);
    for (const id of held) s.state.subRoutes = s.state.subRoutes.filter((r) => r.id !== id);
    s.touch();
    await new Promise((r) => setTimeout(r, 550));
    return { removed: held.length };
  }, target.day);
  await openTab();
  const noLoops = await page.evaluate(() => {
    const warn = document.querySelector('.warn');
    return {
      selects: document.querySelectorAll('[data-loop-for]').length,
      cards: document.querySelectorAll('.nearby-card').length,
      foot: Boolean(document.querySelector('.loop-foot')),
      warnLabel: warn?.querySelector('.warn-label')?.textContent.trim(),
      warnFact: warn?.querySelector('.warn-fact')?.textContent.trim().replace(/\s+/g, ' '),
      warnFirst: warn && document.querySelector('.nearby-card')
        && warn.getBoundingClientRect().top < document.querySelector('.nearby-card').getBoundingClientRect().top,
    };
  });
  console.log('  no loops:', JSON.stringify(noLoops));
  check('§3.7 · with no sub routes the select DOES NOT APPEAR',
        noLoops.selects === 0 && noLoops.cards > 0, `${noLoops.selects} on ${noLoops.cards} cards`);
  check('§3.7 · nor the dark foot card — nothing to list', noLoops.foot === false);
  check('§3.7 · one .warn-class line says where to go instead',
        noLoops.warnLabel === 'NO FREE TIME YET', noLoops.warnLabel);
  check('§3.7 · and it names the tap, as every warning in this app does',
        /pencil on the\s*Plan/.test(noLoops.warnFact || ''), noLoops.warnFact);
  check('§3.7 · at the TOP of the list, not the foot', noLoops.warnFirst === true);

  // ============================ 2 · F5(b) migration
  const migrated = await page.evaluate(async (day) => {
    const s = window.__store;
    const a = s.addSubRoute(day, { name: 'Later loop', depart: '17:40', returnBy: '19:30' });
    const b = s.addSubRoute(day, { name: 'Earlier loop', depart: '09:10', returnBy: '11:00' });
    const near = s.state.places.filter((p) => p.anchorPlaceID);
    const shared = near.slice(0, 2).map((p) => p.id);
    // Put both places in BOTH loops, the state F5(b) retires.
    for (const route of [a, b]) {
      route.placeIDs = [...shared];
    }
    s.touch();
    const before = s.subRoutesFor(day).map((l) => [l.name, (l.placeIDs || []).length]);
    const dropped = s.unifyLoopMembership();
    const after = s.subRoutesFor(day).map((l) => [l.name, (l.placeIDs || []).length]);
    // idempotent
    const again = s.unifyLoopMembership();
    return { before, dropped: dropped.length, after, again: again.length,
             kept: s.subRoutesFor(day).filter((l) => (l.placeIDs || []).includes(shared[0])).map((l) => l.name) };
  }, target.day);
  console.log('  migration:', JSON.stringify(migrated));
  check('§3.7 · F5(b) · the migration finds the multi-loop places',
        migrated.dropped === 2, migrated.dropped);
  check('§3.7 · each keeps THE EARLIEST-DEPARTING loop',
        migrated.kept.length === 1 && migrated.kept[0] === 'Earlier loop', JSON.stringify(migrated.kept));
  check('§3.7 · and is dropped from the rest',
        migrated.after.find((r) => r[0] === 'Later loop')?.[1] === 0, JSON.stringify(migrated.after));
  check('§3.7 · it is idempotent — the second run changes nothing',
        migrated.again === 0, migrated.again);

  // ============================ 3 · Add a place, in the panel
  await page.evaluate(async (day) => {
    const s = window.__store;
    s.state.subRoutes = s.state.subRoutes.filter((r) => r.dayNumber !== day || /Earlier loop/.test(r.name));
    s.touch();
    await new Promise((r) => setTimeout(r, 400));
  }, target.day);
  await openTab();
  const form = await page.evaluate(async () => {
    const before = document.querySelectorAll('.nearby-card').length;
    document.querySelector('[data-act="np-open"]').click();
    await new Promise((r) => setTimeout(r, 550));
    const dock = document.querySelector('.dock-form');
    return {
      before,
      dock: Boolean(dock),
      position: dock && getComputedStyle(dock).position,
      scrim: document.querySelectorAll('.scrim').length,
      fields: [...(dock?.querySelectorAll('input, select') || [])].map((e) => e.id),
      catOptions: [...(dock?.querySelector('#np-cat')?.options || [])].length,
      hasService: [...(dock?.querySelector('#np-cat')?.options || [])].some((o) => o.value === 'service'),
      buttons: [...(dock?.querySelectorAll('button') || [])].map((b) => b.textContent.trim()),
      dashedGone: !document.querySelector('[data-act="np-open"]'),
    };
  });
  console.log('  form:', JSON.stringify(form));
  check('§3.7 · + Add a place opens the form IN PLACE, docked',
        form.dock === true && form.position === 'absolute', `${form.dock} ${form.position}`);
  check('§3.7 · with §3.6’s treatment — no scrim', form.scrim === 0, form.scrim);
  check('§3.7 · the dashed button steps aside while its own form is up', form.dashedGone === true);
  check('§3.7 · name, category and walk', form.fields.join(',') === 'np-name,np-cat,np-walk',
        JSON.stringify(form.fields));
  check('§3.7 · the category select is built from CATEGORY_LABELS, service included',
        form.catOptions === 7 && form.hasService === true,
        `${form.catOptions} options, service ${form.hasService}`);
  check('§3.7 · jade Add and a ghost Cancel',
        form.buttons.includes('Add') && form.buttons.includes('Cancel'), JSON.stringify(form.buttons));

  const refused = await page.evaluate(async () => {
    document.querySelector('[data-act="np-save"]').click();
    await new Promise((r) => setTimeout(r, 500));
    return {
      err: document.querySelector('.dock-form [style*="danger-fg"]')?.textContent.trim(),
      stillUp: Boolean(document.querySelector('.dock-form')),
      cards: document.querySelectorAll('.nearby-card').length,
    };
  });
  console.log('  refused:', JSON.stringify(refused));
  check('§3.7 · an empty name refuses in the field, in rust',
        refused.err === 'A name, or a map link.', refused.err);
  check('§3.7 · and the form stays up with nothing added',
        refused.stillUp === true && refused.cards === form.before,
        `${refused.stillUp} ${refused.cards}`);

  const added = await page.evaluate(async () => {
    document.querySelector('#np-name').value = 'A Place I Just Added';
    document.querySelector('#np-cat').value = 'service';
    document.querySelector('#np-walk').value = '7';
    document.querySelector('[data-act="np-save"]').click();
    await new Promise((r) => setTimeout(r, 1200));
    const s = window.__store;
    const rec = s.state.places.find((p) => p.name === 'A Place I Just Added');
    return {
      saved: Boolean(rec), category: rec?.category, walk: rec?.legs?.[0]?.minutes,
      anchored: rec?.anchorPlaceID,
      cards: document.querySelectorAll('.nearby-card').length,
      formGone: !document.querySelector('.dock-form'),
      onScreen: /A Place I Just Added/.test(document.querySelector('#app').textContent),
    };
  });
  console.log('  added:', JSON.stringify(added));
  check('§3.7 · a real add saves against THIS stop',
        added.saved === true && added.anchored === target.placeID,
        `${added.anchored} vs ${target.placeID}`);
  check('§3.7 · with the chosen category and walk', added.category === 'service' && added.walk === 7,
        `${added.category} / ${added.walk}`);
  check('§3.7 · the list grows by one and the form closes',
        added.cards === form.before + 1 && added.formGone === true,
        `${added.cards} vs ${form.before + 1}`);
  check('§3.7 · and it is on screen without leaving the tab', added.onScreen === true);

  // ============================ 4 · swipe-to-delete stays
  const swipe = await page.evaluate(async () => {
    const row = document.querySelector('[data-place-row]');
    if (!row) return { missing: true };
    const bin = row.querySelector('.swipe-bin');
    const box = row.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const at = (t, x, win) => (win ? window : row).dispatchEvent(new PointerEvent(t, {
      bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true,
    }));
    const x0 = box.right - 30;
    at('pointerdown', x0);
    const rest = getComputedStyle(bin).visibility;
    at('pointermove', x0 - 14, true);
    at('pointermove', x0 - 60, true);
    const mid = getComputedStyle(bin).visibility;
    at('pointerup', x0 - 60, true);
    await new Promise((r) => setTimeout(r, 300));
    return { rest, mid, hasBin: Boolean(bin) };
  });
  console.log('  swipe:', JSON.stringify(swipe));
  check('§3.7 · swipe-to-delete stays on the tab — a managing surface must delete',
        swipe.hasBin === true && swipe.rest === 'hidden' && swipe.mid === 'visible',
        JSON.stringify(swipe));
}

// ----------------------------------------------------------------------
{

  // ============================ the fuller screen, reached from the DAY
  await go('nearby', { dayScope: true });
  const day = await page.evaluate(() => {
    const scroll = document.querySelector('.scroll');
    return {
      title: document.querySelector('.push-title, .screen-title')?.textContent.trim(),
      dock: document.querySelectorAll('.dock, .dock-btn, .dock-loops, .dock-loop').length,
      round: document.querySelectorAll('.nearby-add, [data-pick]').length,
      alsoIn: document.querySelectorAll('.leg-in').length,
      sortStays: document.querySelectorAll('[data-act="sort-toggle"]').length,
      catChips: document.querySelectorAll('.chiprow .cat').length,
      catChipLabels: [...document.querySelectorAll('.chiprow .cat')].map((c) => c.textContent.trim()),
      groups: document.querySelectorAll('.nearby-card').length,
      arrange: /Arrange|Start one/.test(scroll.textContent + (document.querySelector('#app').textContent || '')),
    };
  });
  console.log('  day-wide:', JSON.stringify(day));
  check('§3.7 · the day-wide screen survives — its own job, "Around day N"',
        /Around day/i.test(day.title || ''), day.title);
  check('§3.7 · the dock is gone from it too', day.dock === 0, day.dock);
  check('§3.7 · and the round + / ✓ with it', day.round === 0, day.round);
  check('§3.7 · F5(b) · no "in ‹loop›" chips here either', day.alsoIn === 0, day.alsoIn);
  check('§3.7 · Arrange and Start one are gone — arranging is the Plan’s',
        day.arrange === false);
  check('§3.7 · SORT survives here, where the list spans stops',
        day.sortStays === 1, day.sortStays);
  check('§3.7 · and so does the chip row, on a screen with the width for it',
        day.catChips > 1, JSON.stringify(day.catChipLabels));
  // The held item: CATS now derives, so `service` has a chip.
  check('§3.7 · CATS derives from CATEGORY_LABELS — Service has a chip at last',
        day.catChipLabels.includes('Service'), JSON.stringify(day.catChipLabels));
  check('§3.7 · and All is still first', day.catChipLabels[0] === 'All', day.catChipLabels[0]);

  // ---- the same select, on this surface --------------------------------
  const sameSel = await page.evaluate(async () => {
    const s = window.__store;
    // Land on a stop that has both places and a loop, via the day-wide list.
    const anchor = (() => {
      const byAnchor = new Map();
      for (const p of s.state.places) {
        if (p.anchorPlaceID) byAnchor.set(p.anchorPlaceID, (byAnchor.get(p.anchorPlaceID) || 0) + 1);
      }
      return [...byAnchor.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    })();
    const dayNumber = s.dayForPlace(anchor);
    if (!s.subRoutesFor(dayNumber).length) {
      s.addSubRoute(dayNumber, { name: 'A loop for the check', depart: '10:00', returnBy: '12:00' });
    }
    s.selectDay(dayNumber);
    window.__nav.go('nearby', { anchorID: anchor, anchorName: 'the stop' });
    await new Promise((r) => setTimeout(r, 700));
    const sel = document.querySelector('[data-loop-for]');
    return {
      dayNumber,
      selects: document.querySelectorAll('[data-loop-for]').length,
      cards: document.querySelectorAll('.nearby-card').length,
      edit: document.querySelectorAll('.edit-chip').length,
      options: [...(sel?.options || [])].map((o) => o.textContent.trim()),
      round: document.querySelectorAll('.nearby-add, [data-pick]').length,
      dock: document.querySelectorAll('.dock').length,
    };
  });
  console.log('  same select:', JSON.stringify(sameSel));
  check('§3.7 · the per-stop view of this screen carries the SAME select',
        sameSel.selects === sameSel.cards && sameSel.selects > 0,
        `${sameSel.selects} / ${sameSel.cards}`);
  check('§3.7 · with "Saved only" and the day’s loops',
        sameSel.options[0] === 'Saved only' && sameSel.options.length >= 2,
        JSON.stringify(sameSel.options));
  check('§3.7 · no round button and no dock on it either',
        sameSel.round === 0 && sameSel.dock === 0, `${sameSel.round} / ${sameSel.dock}`);
  // B4 · carried onto this surface, which §3.7's task explicitly required.
  check('B4 · and the Edit chip is on this surface now too',
        sameSel.edit === sameSel.cards && sameSel.edit > 0, `${sameSel.edit} / ${sameSel.cards}`);

  const editGoes = await page.evaluate(async () => {
    const chip = document.querySelector('.edit-chip');
    const want = chip.getAttribute('aria-label');
    chip.click();
    await new Promise((r) => setTimeout(r, 700));
    return { want, hash: location.hash, name: document.querySelector('.dest-name')?.textContent.trim() };
  });
  console.log('  edit goes:', JSON.stringify(editGoes));
  check('B4 · the Edit chip here opens the place’s own screen, where the sheet lives',
        editGoes.hash === '#dest' && Boolean(editGoes.name), JSON.stringify(editGoes));

  // ---- and nothing routes a STOP to the day-wide screen any more -------
  const routes = await page.evaluate(async () => {
    const src = await Promise.all([
      fetch('./js/screens/sub.js').then((r) => r.text()),
      fetch('./js/screens/plan.js').then((r) => r.text()),
      fetch('./js/screens/dest.js').then((r) => r.text()),
      fetch('./js/screens/map.js').then((r) => r.text()),
    ]);
    const all = src.join('\n');
    return {
      total: (all.match(/go\('nearby'/g) || []).length,
      dayScope: (all.match(/go\('nearby',\s*\{\s*dayScope: true\s*\}\)/g) || []).length,
    };
  });
  console.log('  routes:', JSON.stringify(routes));
  check('§3.7 · exactly ONE route into the day-wide screen, and it is the day',
        routes.total === 1 && routes.dayScope === 1, JSON.stringify(routes));
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log(`--- PAGE ERRORS (${pageErrors.length}) ---`);
pageErrors.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);
