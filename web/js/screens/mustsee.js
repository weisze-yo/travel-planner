// Screen 2g — Must-see. Example images of the shots this stop is known for,
// each with where to stand and a tick for when you have it. Below them, the
// outfit advice this day's weather implies — and, kept separate, a record of
// what you are actually bringing.

import { html, raw, icon, delegate } from '../util.js';
import * as store from '../store.js';
import { state } from '../store.js';
import { back } from '../nav.js';
import { backHeader, mapsLinks } from './parts.js';
import { OUTFIT_SUGGESTION, OUTFIT_SUGGESTION_CHIPS, OUTFIT_PICKS } from '../data.js';

export default {
  id: 'mustsee',
  tab: 'plan',

  render(params = {}) {
    const anchorID = params.anchorID || store.subRoute()?.anchorPlanItemID;
    const shots = store.shotsFor(anchorID);
    const anchorName = params.anchorName || store.subRoute()?.anchorName || 'this stop';
    const wx = store.weather();
    const mine = store.outfitFor()?.pieces || [];
    const picks = OUTFIT_PICKS.filter((p) => !mine.includes(p));
    const first = shots[0];

    return html`
      <section class="screen">
        ${backHeader({ title: 'Must-see', sub: `${anchorName} · ${shots.length} known shots` })}

        <div class="scroll" style="padding:14px 16px 24px">
          ${shots.map((shot) => html`
            <div class="card mb12" style="overflow:hidden">
              <div class="shot-img">
                ${shot.imagePath
                  ? html`<img src="${shot.imagePath}" alt="${shot.title}">`
                  : 'example photo'}
                <button class="shot-tick${shot.captured ? ' on' : ''}" data-act="shot" data-id="${shot.id}"
                        role="checkbox" aria-checked="${shot.captured ? 'true' : 'false'}"
                        aria-label="Mark ${shot.title} as taken">
                  ${raw(icon.tick(shot.captured ? '#fff' : '#B4BEB9', 13))}
                </button>
              </div>
              <div style="padding:12px 14px">
                <div class="row g8" style="align-items:baseline">
                  <div class="shot-title">${shot.title}</div>
                  <div class="shot-tag">${shot.tag}</div>
                </div>
                <div class="shot-desc">${shot.summary}</div>
                <div class="shot-where">${raw(icon.pin)}${shot.whereToFind}</div>
              </div>
            </div>`)}

          ${shots.length ? '' : html`
            <div class="empty">
              Nothing noted for ${anchorName} yet.<br>
              Adding your own must-see spots is still to come.
            </div>`}

          <div class="card pad mb12">
            <div class="row g8 center">
              <div class="eyebrow grow" style="font-size:11px">OUTFIT</div>
              <div class="f115 w700" style="color:var(--jade)">${wx ? `${wx.high} °C, ${wx.summary}` : ''}</div>
            </div>
            <div class="row g12 mt10">
              <div class="outfit-ref">reference</div>
              <div class="outfit-text">${OUTFIT_SUGGESTION}</div>
            </div>
            <div class="row g6 wrap mt10">
              ${OUTFIT_SUGGESTION_CHIPS.map((c, i) => html`
                <span class="chip ${i === 0 ? 'amber' : ''}">${c}</span>`)}
              <span class="chip jade">→ added to Trip prep</span>
            </div>

            <div class="hairline"></div>

            <div class="eyebrow jade" style="font-size:11px">WHAT I AM ACTUALLY BRINGING</div>
            <div class="f115 muted lh145 mt4">Your record, kept separate from the suggestion above.</div>

            ${mine.length ? html`
              <div class="row g6 wrap mt10">
                ${mine.map((piece) => html`
                  <button class="mine-chip" data-act="outfit-remove" data-piece="${piece}">
                    ${piece}<span style="font-size:11px;opacity:.6">✕</span>
                  </button>`)}
              </div>` : ''}

            <div class="row g6 mt10">
              <input id="outfit-new" class="grow" placeholder="Add a piece">
              <button class="btn jade none" style="width:58px;height:37px" data-act="outfit-add">Add</button>
            </div>

            ${picks.length ? html`
              <div class="row g6 wrap mt8">
                ${picks.map((p) => html`<button class="pick-chip" data-act="outfit-pick" data-piece="${p}">+ ${p}</button>`)}
              </div>` : ''}
          </div>

          ${first ? html`
            <div class="card pad">
              <div class="eyebrow">WHERE TO STAND</div>
              <div class="f125 muted lh145 mt6">${first.whereToFind} — ${first.title}.</div>
              <a class="btn ink mt10" href="${mapsLinks.google(first.title, first.latitude ? { lat: first.latitude, lng: first.longitude } : null)}"
                 target="_blank" rel="noopener">Navigate to spot</a>
            </div>` : ''}
        </div>
      </section>`;
  },

  mount(root) {
    delegate(root, '[data-act="back"]', () => back());
    delegate(root, '[data-act="shot"]', (el) => store.toggleShot(el.dataset.id));
    delegate(root, '[data-act="outfit-remove"]', (el) => store.removeOutfitPiece(el.dataset.piece));
    delegate(root, '[data-act="outfit-pick"]', (el) => store.addOutfitPiece(el.dataset.piece));
    delegate(root, '[data-act="outfit-add"]', () => {
      const input = root.querySelector('#outfit-new');
      if (!input?.value.trim()) return;
      store.addOutfitPiece(input.value);
      input.value = '';
    });
  },
};
