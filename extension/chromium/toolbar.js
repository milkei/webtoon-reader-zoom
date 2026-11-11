/*
 * A small page-side control for the existing reader. The original
 * content.js remains unchanged; settings are shared via storage.local.
 */
(() => {
  'use strict';

  if (globalThis.__soheeWebtoonToolbarV05) return;
  globalThis.__soheeWebtoonToolbarV05 = true;

  const api = globalThis.browser ?? globalThis.chrome;
  if (!api?.storage?.local) return;

  const clamp = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(100, Math.max(25, Math.round(n / 5) * 5)) : 50;
  };
  const onEpisode = () => location.pathname.startsWith('/webtoon/detail');
  let percent = 50;
  let collapsed = false;

  const host = document.createElement('div');
  host.id = 'sohee-webtoon-reader-toolbar';
  host.setAttribute('data-collapsed', 'false');
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      position: fixed !important;
      top: 46% !important;
      right: 18px !important;
      z-index: 2147483647 !important;
      display: block;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
      color: #26342d;
      direction: ltr;
      user-select: none;
      -webkit-font-smoothing: antialiased;
      color-scheme: light;
    }
    *, *::before, *::after { box-sizing: border-box; }
    button { font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    button:focus-visible { outline: 3px solid #168f4b; outline-offset: 2px; }
    .panel {
      width: 234px;
      padding: 10px;
      border: 1px solid #dfe7e1;
      border-radius: 14px;
      background: rgba(255,255,255,.97);
      box-shadow: 0 5px 20px rgba(19,42,28,.13);
    }
    .heading { display: flex; align-items: center; justify-content: space-between; gap: 5px; margin-bottom: 9px; }
    .heading strong { font-size: 12px; font-weight: 700; letter-spacing: -.2px; }
    .current { color: #168f4b; font-size: 13px; font-weight: 800; margin-left: auto; font-variant-numeric: tabular-nums; }
    .collapse {
      height: 24px; width: 26px;
      border: 0; border-radius: 7px;
      color: #56695c; background: #f0f5f1;
      font-size: 17px; font-weight: 600; line-height: 1;
    }
    .collapse:hover { background: #e4eee7; }
    .presets { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
    .preset {
      border: 1px solid #dce5de;
      border-radius: 8px; min-height: 33px; padding: 0 1px;
      background: #f8faf8; color: #34473a;
      font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums;
    }
    .preset:hover { background: #eaf5ee; }
    .preset[aria-pressed="true"] { background: #168f4b; border-color: #168f4b; color: #fff; }
    .mini {
      display: none; gap: 6px; align-items: center; justify-content: center;
      min-width: 66px; min-height: 37px;
      padding: 5px 9px;
      color: #16733e;
      background: rgba(255,255,255,.97);
      border: 1px solid #dce7de; border-radius: 11px;
      box-shadow: 0 5px 18px rgba(19,42,28,.13);
      font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums;
    }
    .mini:hover { background: #ecf7ef; }
    .chevron { font-size: 10px; color: #6a8a72; }
    :host([data-collapsed="true"]) .panel { display: none; }
    :host([data-collapsed="true"]) .mini { display: flex; }
    @media (max-width: 800px) {
      :host { top: auto !important; bottom: 64px !important; right: 9px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .panel, .mini { background: #242e27; color: #eaf2ec; border-color: #4a5b4e; }
      .current, .mini { color: #80df9d; }
      .preset { background: #314038; color: #eaf2ec; border-color: #516655; }
      .preset:hover { background: #405c48; }
      .preset[aria-pressed="true"] { background: #168f4b; border-color: #168f4b; color: white; }
      .collapse { color: #d9e9dd; background: #435547; }
      .collapse:hover { background: #536a57; }
    }
    @media (prefers-reduced-motion: no-preference) {
      .preset, .collapse, .mini { transition: background-color 110ms ease; }
    }
  `;

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', '웹툰 본문 이미지 배율');
  panel.innerHTML = `
    <div class="heading">
      <strong>본문 크기</strong><span class="current" id="current">50%</span>
      <button type="button" class="collapse" id="collapse" aria-label="배율 조절바 접기" title="접기">−</button>
    </div>
    <div class="presets" role="group" aria-label="배율 바로 선택">
      <button type="button" class="preset" data-percent="25" aria-pressed="false">25%</button>
      <button type="button" class="preset" data-percent="50" aria-pressed="true">50%</button>
      <button type="button" class="preset" data-percent="75" aria-pressed="false">75%</button>
      <button type="button" class="preset" data-percent="100" aria-pressed="false">100%</button>
    </div>`;
  const mini = document.createElement('button');
  mini.type = 'button';
  mini.className = 'mini';
  mini.setAttribute('aria-label', '웹툰 배율 조절바 펼치기');
  mini.title = '본문 배율 조절 펼치기';
  mini.innerHTML = `<span id="mini-value">50%</span><span class="chevron" aria-hidden="true">◀</span>`;
  shadow.append(style, panel, mini);
  const valueLabel = shadow.getElementById('current');
  const miniValue = shadow.getElementById('mini-value');
  const presets = Array.from(shadow.querySelectorAll('.preset'));

  function render() {
    valueLabel.textContent = `${percent}%`;
    miniValue.textContent = `${percent}%`;
    host.setAttribute('data-collapsed', String(collapsed));
    for (const button of presets) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.percent) === percent));
    }
  }

  function updateVisibility() {
    if (!host.isConnected && document.documentElement) document.documentElement.append(host);
    host.style.setProperty('display', onEpisode() ? 'block' : 'none', 'important');
  }

  async function setPercent(next) {
    const previous = percent;
    percent = clamp(next);
    render();
    try {
      await api.storage.local.set({ percent });
    } catch (error) {
      percent = previous;
      render();
      console.warn('[Sohee Webtoon Reader] 배율 설정 저장 실패', error);
    }
  }

  async function setCollapsed(next) {
    const previous = collapsed;
    collapsed = !!next;
    render();
    try {
      await api.storage.local.set({ toolbarCollapsed: collapsed });
    } catch (error) {
      collapsed = previous;
      render();
      console.warn('[Sohee Webtoon Reader] 툴바 설정 저장 실패', error);
    }
  }

  for (const button of presets) {
    button.addEventListener('click', () => void setPercent(button.dataset.percent));
  }
  shadow.getElementById('collapse').addEventListener('click', () => void setCollapsed(true));
  mini.addEventListener('click', () => void setCollapsed(false));

  api.storage.local.get({ percent: 50, toolbarCollapsed: false })
    .then((saved) => {
      percent = clamp(saved.percent);
      collapsed = !!saved.toolbarCollapsed;
      render();
    })
    .catch((error) => console.warn('[Sohee Webtoon Reader] 설정 읽기 실패', error));

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.percent) percent = clamp(changes.percent.newValue);
    if (changes.toolbarCollapsed) collapsed = !!changes.toolbarCollapsed.newValue;
    render();
  });

  const observer = new MutationObserver((records) => {
    if (records.some(r => r.addedNodes.length || r.removedNodes.length)) updateVisibility();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', updateVisibility);
  window.addEventListener('pageshow', updateVisibility);
  updateVisibility();
})();
