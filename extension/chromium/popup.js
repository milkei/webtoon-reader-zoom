'use strict';

const slider = document.getElementById('size');
const value = document.getElementById('value');
const status = document.getElementById('status');
const presets = Array.from(document.querySelectorAll('.preset'));
let activeTabId = null;

// Slider coordinates keep 50% at the visual center, as in v0.3.
function positionToPercent(position) {
  const p = Math.max(0, Math.min(100, Number(position)));
  const percent = p <= 50 ? 25 + p / 2 : 50 + (p - 50);
  return Math.max(25, Math.min(100, Math.round(percent / 5) * 5));
}

function percentToPosition(percent) {
  const n = Math.max(25, Math.min(100, Number(percent)));
  return n <= 50 ? (n - 25) * 2 : 50 + (n - 50);
}

function renderPercent(percent, syncSlider = true) {
  value.textContent = `${percent}%`;
  if (syncSlider) slider.value = String(percentToPosition(percent));
  slider.setAttribute('aria-valuenow', String(percent));
  slider.setAttribute('aria-valuetext', `${percent}%`);
  for (const button of presets) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.percent) === percent));
  }
}

async function savePercent(percent) {
  renderPercent(percent);
  try {
    await chrome.storage.local.set({ percent });
    await refreshStatus();
  } catch {
    status.textContent = '설정을 저장하지 못했어. 확장 프로그램을 다시 열어 봐.';
  }
}

async function refreshStatus() {
  if (activeTabId === null) return;
  try {
    const res = await chrome.tabs.sendMessage(activeTabId, { type: 'reader-status' });
    if (!res.onDetailPage) {
      status.textContent = '네이버 웹툰의 회차 화면에서만 동작해.';
    } else if (res.count === 0) {
      status.textContent = '본문 이미지 0장 감지 · 웹툰이 다 로드되면 다시 열어 봐.';
    } else if (res.percent === 100) {
      status.textContent = `본문 이미지 ${res.count}장 감지 · 원본 크기로 표시 중`;
    } else {
      status.textContent = `본문 이미지 ${res.count}장 감지 · ${res.adjustedCount}장 크기 조절 적용`;
    }
  } catch {
    status.textContent = '웹툰 회차를 새로고침한 다음 다시 열어 봐.';
  }
}

for (const button of presets) {
  button.addEventListener('click', () => savePercent(Number(button.dataset.percent)));
}

slider.addEventListener('input', () => renderPercent(positionToPercent(slider.value), false));
slider.addEventListener('change', () => savePercent(positionToPercent(slider.value)));

(async () => {
  const saved = await chrome.storage.local.get({ percent: 50 });
  const n = Number(saved.percent);
  renderPercent(Number.isFinite(n) ? Math.max(25, Math.min(100, Math.round(n / 5) * 5)) : 50);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id !== undefined) activeTabId = tab.id;
  await refreshStatus();
})();
