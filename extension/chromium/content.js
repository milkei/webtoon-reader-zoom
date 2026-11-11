/*
 * Only adjusts comic frames; page chrome and comments retain browser zoom.
 * No network requests and no page data are collected.
 */
(() => {
  'use strict';

  if (window.__soheeNaverWebtoonReaderV2) return;
  window.__soheeNaverWebtoonReaderV2 = true;

  const SELECTOR = [
    'img[alt="comic content"]',
    'img[src*="image-comic.pstatic.net/webtoon/"]',
    '#comic_view_area img[src*="/webtoon/"]',
    '.wt_viewer img[src*="/webtoon/"]'
  ].join(', ');

  const PROPERTIES = ['width', 'height', 'max-width', 'display', 'margin-left', 'margin-right'];
  const originals = new WeakMap();
  let percent = 50;
  let scheduled = false;

  const onDetailPage = () => location.pathname.startsWith('/webtoon/detail');
  const clamp = (n) => Math.max(25, Math.min(100, Math.round(Number(n) / 5) * 5 || 50));

  function comicImages() {
    if (!onDetailPage()) return [];
    return Array.from(document.querySelectorAll(SELECTOR)).filter((img) => {
      if (!(img instanceof HTMLImageElement)) return false;
      const url = img.currentSrc || img.src || '';
      return img.getAttribute('alt') === 'comic content' ||
        /image-comic\.pstatic\.net\/webtoon\//.test(url) ||
        (/\/webtoon\//.test(url) && !!img.closest('#comic_view_area, .wt_viewer'));
    });
  }

  function saveOriginal(img) {
    if (originals.has(img)) return originals.get(img);
    const props = {};
    for (const p of PROPERTIES) {
      props[p] = {
        value: img.style.getPropertyValue(p),
        priority: img.style.getPropertyPriority(p)
      };
    }
    const state = { props, originalWidth: 0, loadListenerAdded: false };
    originals.set(img, state);
    return state;
  }

  function restore(img, state) {
    for (const p of PROPERTIES) {
      const saved = state.props[p];
      if (saved.value) img.style.setProperty(p, saved.value, saved.priority);
      else img.style.removeProperty(p);
    }
  }

  function originalWidthOf(img, state) {
    if (state.originalWidth > 0) return state.originalWidth;
    // Read the layout *before* setting the new width, not the file's pixel dimensions.
    const bounds = img.getBoundingClientRect();
    const layoutWidth = bounds.width || img.clientWidth;
    if (layoutWidth >= 50) {
      state.originalWidth = layoutWidth;
      return layoutWidth;
    }
    // Lazy-loaded images can initially have no measurable size.
    if (!state.loadListenerAdded) {
      state.loadListenerAdded = true;
      img.addEventListener('load', scheduleApply, { once: true });
    }
    return 0;
  }

  function apply(img) {
    const state = saveOriginal(img);
    if (percent === 100) {
      restore(img, state);
      return;
    }
    const originalWidth = originalWidthOf(img, state);
    if (!originalWidth) return;
    img.style.setProperty('width', `${Math.round(originalWidth * percent / 100)}px`, 'important');
    img.style.setProperty('max-width', '100%', 'important');
    img.style.setProperty('height', 'auto', 'important');
    img.style.setProperty('display', 'block', 'important');
    img.style.setProperty('margin-left', 'auto', 'important');
    img.style.setProperty('margin-right', 'auto', 'important');
  }

  function applyAll() {
    scheduled = false;
    for (const img of comicImages()) apply(img);
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyAll);
  }

  function recalibrateAfterResize() {
    // Clear prior measured widths, returning the images to the page's natural layout.
    // Next animation frame remeasures original widths at the new window size.
    for (const img of comicImages()) {
      const state = saveOriginal(img);
      restore(img, state);
      state.originalWidth = 0;
    }
    scheduleApply();
  }

  chrome.storage.local.get({ percent: 50 }, (stored) => {
    percent = clamp(stored.percent);
    scheduleApply();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.percent) return;
    percent = clamp(changes.percent.newValue);
    scheduleApply();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'reader-status') return;
    const imgs = comicImages();
    sendResponse({
      onDetailPage: onDetailPage(),
      count: imgs.length,
      adjustedCount: percent === 100 ? 0 : imgs.filter(img => originals.get(img)?.originalWidth > 0).length,
      percent
    });
  });

  const observer = new MutationObserver((records) => {
    // Images may be inserted later by React or on moving to another episode.
    if (records.some((r) => r.addedNodes.length || r.removedNodes.length)) scheduleApply();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', recalibrateAfterResize);
  window.addEventListener('pageshow', scheduleApply);
  scheduleApply();
})();
