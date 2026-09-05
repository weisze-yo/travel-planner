// Batch 0 — the three CSS additions the approved design already assumes
// exist. Each assertion is a COMPUTED style read out of a real render at
// 390x844, not a source-file grep: the whole point of N-1 is that a class
// can be referenced by two screens for months and still not exist, and only
// getComputedStyle can tell the difference between "defined" and "styled".
//
//   N-1  .hint-jade      p0-1-role-and-copy-identity-design.md §8
//   M-15 .sync-dot.grey  p1-status-visibility-design.md §1.3
//   N-14 .side.stacked   p0-4-review-design.md §3.2, §9
//        .review-group
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
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  serviceWorkers: 'block',
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
await page.waitForTimeout(800);
await page.evaluate(async () => {
  window.__store = await import('./js/store.js');
  window.__nav = await import('./js/nav.js');
  window.__parts = await import('./js/screens/parts.js');
});

const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).map(Number);

// =================================================== N-1 · .hint-jade
// Rendered by the real screen, not a probe: stuck.js emits it whenever
// nothing is waiting to be sent, which is the demo trip's resting state.
{
  await page.evaluate(() => window.__nav.go('stuck'));
  await page.waitForTimeout(400);
  const hint = await page.evaluate(() => {
    const el = document.querySelector('.hint-jade');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      text: el.textContent.trim().slice(0, 60),
      bg: cs.backgroundColor, border: cs.borderTopWidth + ' ' + cs.borderTopColor,
      radius: cs.borderTopLeftRadius, pad: cs.paddingTop,
      size: cs.fontSize, lh: cs.lineHeight, color: cs.color,
      width: r.width, scrollW: el.scrollWidth, clientW: el.clientWidth,
    };
  });
  check('N-1: a real screen renders .hint-jade (stuck, nothing waiting)', !!hint, hint ? hint.text : 'no .hint-jade in the DOM');
  if (hint) {
    check('N-1: it is a jade card, not transparent body text', String(hint.bg) === 'rgb(230, 239, 235)', hint.bg);
    check('N-1: 1px jade-bd border', hint.border === '1px rgb(207, 224, 217)', hint.border);
    check('N-1: r16', hint.radius === '16px', hint.radius);
    check('N-1: 14px pad', hint.pad === '14px', hint.pad);
    // The defect this fixes: it inherited 16px body text, LARGER than the
    // 12-13px copy around it. The design specifies 12.5px.
    check('N-1: body is 12.5px, not the inherited 16px', hint.size === '12.5px', hint.size);
    check('N-1: line-height 1.5', Math.abs(parseFloat(hint.lh) - 12.5 * 1.5) < 0.6, hint.lh);
    check('N-1: jade-fg text', String(hint.color) === 'rgb(93, 140, 124)', hint.color);
    check('N-1: does not overflow its own box at 390', hint.scrollW <= hint.clientW + 1, `${hint.scrollW} vs ${hint.clientW}`);
  }
}

// ============================================== M-15 · .sync-dot.grey
// Driven through the app's own syncDot(), so the markup under test is the
// markup the app emits, styled by the real stylesheet in the real document.
{
  const dot = await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = '__probe';
    // .sync-dot is a <span>; width/height only apply because the real
    // .trip-chip is a flex container and blockifies it. Reproduce that, or
    // the probe measures 0x0 and tells you nothing about the shipped dot.
    host.style.cssText = 'display:flex;align-items:center';
    host.innerHTML = window.__parts.syncDot({ kind: 'local', count: 0, line: '', ageDays: 0, reason: '' });
    document.body.appendChild(host);
    const el = host.querySelector('.sync-dot');
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      cls: el.className, label: el.getAttribute('aria-label'),
      bg: cs.backgroundColor, shadow: cs.boxShadow,
      w: r.width, h: r.height, radius: cs.borderTopLeftRadius,
    };
  });
  check('M-15: syncDot({kind:local}) still emits .sync-dot.grey', /\bgrey\b/.test(dot.cls), dot.cls);
  check('M-15: the aria-label is untouched', dot.label === 'Saved on this device only', dot.label);
  check('M-15: the centre is transparent — the dot is hollow', /rgba\(0, 0, 0, 0\)|transparent/.test(dot.bg), dot.bg);
  const nums = rgb(dot.shadow);
  check('M-15: a 1.5px inset ring in --faint', /inset/.test(dot.shadow) && /1\.5px/.test(dot.shadow)
    && nums.slice(0, 3).join(',') === '180,190,185', dot.shadow);
  check('M-15: still 8px, still round', dot.w === 8 && dot.h === 8 && dot.radius === '50%', `${dot.w}x${dot.h} r${dot.radius}`);
  // It must differ from `saved` by SHAPE, not hue alone — the whole finding.
  const jade = await page.evaluate(() => {
    const host = document.getElementById('__probe');
    host.innerHTML = window.__parts.syncDot({ kind: 'saved', count: 0, line: '', ageDays: 0, reason: '' });
    const cs = getComputedStyle(host.querySelector('.sync-dot'));
    return { bg: cs.backgroundColor, shadow: cs.boxShadow };
  });
  check('M-15: `saved` is still a solid jade dot with no ring', rgb(jade.bg).slice(0, 3).join(',') === '31,111,92' && jade.shadow === 'none', `${jade.bg} / ${jade.shadow}`);
  check('M-15: local and saved now differ in greyscale, not hue alone', jade.shadow === 'none' && /inset/.test(dot.shadow), '');
  await page.evaluate(() => document.getElementById('__probe')?.remove());
}

// ========================================== N-14 · .side.stacked, .review-group
// The class is inert until Review's markup opts in (batch 3). What batch 0
// must prove is that the rule EXISTS and produces one full-width column,
// and that adding it does not change how .sides renders today.
{
  const sides = await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = '__probe';
    host.style.cssText = 'width:318px'; // a .card's inner width at 390
    host.innerHTML = `
      <div class="sides" id="__today">
        <div class="side"><div class="side-k">YOURS</div><div class="side-v">09:15 - 10:00</div></div>
        <div class="side theirs"><div class="side-k">THEIRS</div><div class="side-v">10:30 - 11:15</div></div>
      </div>
      <div class="sides" id="__stacked">
        <div class="side stacked"><div class="side-k">YOURS</div><div class="side-v">09:15 - 10:00</div></div>
        <div class="side theirs stacked"><div class="side-k">THEIRS</div><div class="side-v">10:30 - 11:15</div></div>
      </div>
      <div class="review-group" id="__group"></div>`;
    document.body.appendChild(host);
    const box = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    return {
      todayA: box('#__today .side'), todayB: box('#__today .side.theirs'),
      stackA: box('#__stacked .side'), stackB: box('#__stacked .side.theirs'),
      group: getComputedStyle(document.getElementById('__group')).marginTop,
      hostW: document.getElementById('__today').getBoundingClientRect().width,
    };
  });
  check('N-14: without .stacked the two sides are still side by side (no regression)',
    Math.abs(sides.todayA.y - sides.todayB.y) < 1 && sides.todayB.x > sides.todayA.x,
    JSON.stringify([sides.todayA, sides.todayB]));
  check('N-14: with .stacked THEIRS drops below YOURS', sides.stackB.y > sides.stackA.y + 10,
    `${sides.stackA.y} vs ${sides.stackB.y}`);
  check('N-14: each stacked box is the full width of the row, not ~150px',
    Math.abs(sides.stackA.w - sides.hostW) < 1 && Math.abs(sides.stackB.w - sides.hostW) < 1,
    `${sides.stackA.w} / ${sides.stackB.w} of ${sides.hostW}`);
  check('N-14: a stacked box is more than twice the width it had', sides.stackA.w > sides.todayA.w * 2 - 10,
    `${sides.todayA.w} -> ${sides.stackA.w}`);
  const gap = sides.stackB.y - (sides.stackA.y + sides.stackA.h);
  check('N-14: the 8px gap is kept between the stacked boxes', Math.abs(gap - 8) < 0.6, gap);
  check('N-14: .review-group carries the day eyebrow spacing', sides.group === '14px', sides.group);
  await page.evaluate(() => document.getElementById('__probe')?.remove());
}

// ============================================ CJK, measured not eyeballed
{
  const cjk = await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = '__probe';
    host.style.cssText = 'width:318px';
    host.innerHTML = `
      <div class="hint-jade" id="__cjk1">京都の中央市場、朝いちばんの買い出しから始める一日。全部このスマホの中にあります。</div>
      <div class="sides"><div class="side stacked" id="__cjk2"><div class="side-k">YOURS</div>
        <div class="side-v">京都市中央卸売市場第一市場 · 09:15 – 10:00</div></div></div>`;
    document.body.appendChild(host);
    const m = (id) => { const el = document.getElementById(id); return { sw: el.scrollWidth, cw: el.clientWidth, h: el.getBoundingClientRect().height }; };
    return { hint: m('__cjk1'), side: m('__cjk2') };
  });
  check('CJK: .hint-jade wraps rather than overflowing (measured)', cjk.hint.sw <= cjk.hint.cw + 1, `${cjk.hint.sw} vs ${cjk.hint.cw}`);
  check('CJK: .hint-jade grew taller to fit, it did not clip', cjk.hint.h > 30, cjk.hint.h);
  check('CJK: a stacked side holds a long CJK value without overflowing', cjk.side.sw <= cjk.side.cw + 1, `${cjk.side.sw} vs ${cjk.side.cw}`);
  await page.evaluate(() => document.getElementById('__probe')?.remove());
}

console.log(`\n--- PASS (${pass.length})  FAIL (${fail.length}) ---`);
console.log('page errors: ' + pageErrors.length);
pageErrors.forEach((e) => console.log('  ' + e));
await browser.close();
process.exit(fail.length || pageErrors.length ? 1 : 0);
