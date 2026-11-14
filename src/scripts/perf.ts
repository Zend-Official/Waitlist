import { stopSmoothScroll } from './smooth';

/**
 * Real-world performance check.
 *
 * The device hints in Base.astro (RAM, CPU threads, Data Saver) miss many slow
 * phones, so we also measure: during the first ~1.5 s of scrolling we count
 * animation frames. Under 45 fps on average => switch to lite mode right away
 * (native scrolling, chip float off) and remember it for a week, so the next
 * visit starts light.
 *
 * Add ?perf to the URL to see the numbers in a small badge.
 */
const KEY = 'zend-perf';
const SAMPLE_MS = 1500;
const MIN_FPS = 45;
/** A single frame gap longer than this = drawing was paused; discard the sample. */
const FROZEN_MS = 400;
const REMEMBER_DAYS = 7;

export interface PerfReport {
  fps: number | null;
  slowestFrameMs: number | null;
  memoryGB: number | null;
  cpuThreads: number | null;
  saveData: boolean;
  lite: boolean;
  liteReason: string;
}

export function initPerfWatch() {
  const html = document.documentElement;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const report: PerfReport = {
    fps: null,
    slowestFrameMs: null,
    memoryGB: nav.deviceMemory ?? null,
    cpuThreads: nav.hardwareConcurrency ?? null,
    saveData: nav.connection?.saveData === true,
    lite: html.classList.contains('lite'),
    liteReason: html.classList.contains('lite') ? 'device hints or earlier slow measurement' : '',
  };

  const badge = new URLSearchParams(location.search).has('perf') ? createBadge() : null;
  const show = () => badge && renderBadge(badge, report);
  show();

  // Already lite (hints or a remembered result): nothing to measure.
  if (report.lite) return;

  const events = ['wheel', 'touchmove', 'scroll', 'keydown'] as const;
  let measuring = false;
  let done = false;

  const start = () => {
    // Only measure a page the user is actually looking at.
    if (measuring || done || document.visibilityState !== 'visible') return;
    measuring = true;

    let frames = 0;
    let slowest = 0;
    const t0 = performance.now();
    let last = t0;
    const tick = (t: number) => {
      const gap = t - last;
      // A gap this long means the browser paused drawing (tab hidden,
      // window minimised, devtools breakpoint), not that the phone is slow.
      // Throw the sample away and try again on the next scroll.
      if (gap > FROZEN_MS || document.visibilityState !== 'visible') {
        measuring = false;
        return;
      }
      frames += 1;
      slowest = Math.max(slowest, gap);
      last = t;
      if (t - t0 < SAMPLE_MS) {
        requestAnimationFrame(tick);
        return;
      }
      measuring = false;
      done = true;
      events.forEach((ev) => window.removeEventListener(ev, start));
      report.fps = Math.round((frames * 1000) / (t - t0));
      report.slowestFrameMs = Math.round(slowest);
      if (report.fps < MIN_FPS) {
        report.lite = true;
        report.liteReason = `measured ${report.fps} fps while scrolling`;
        goLite();
      }
      show();
      console.info('[zend] scroll performance', report);
    };
    requestAnimationFrame(tick);
  };
  events.forEach((ev) => window.addEventListener(ev, start, { passive: true }));
}

function goLite() {
  document.documentElement.classList.add('lite');
  stopSmoothScroll();
  try {
    localStorage.setItem(KEY, JSON.stringify({ lite: true, until: Date.now() + REMEMBER_DAYS * 864e5 }));
  } catch {
    /* storage blocked: we'll simply measure again next visit */
  }
}

function createBadge() {
  const el = document.createElement('div');
  el.id = 'zend-perf-badge';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText =
    'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:9999;padding:8px 10px;border-radius:8px;' +
    'background:rgba(20,0,39,.88);color:#fff;font:12px/1.45 ui-monospace,monospace;pointer-events:none;white-space:pre';
  document.body.appendChild(el);
  return el;
}

function renderBadge(el: HTMLElement, r: PerfReport) {
  el.textContent = [
    `fps (first 1.5s of scroll): ${r.fps ?? 'scroll to measure'}`,
    `slowest frame: ${r.slowestFrameMs != null ? r.slowestFrameMs + ' ms' : '-'}`,
    `RAM: ${r.memoryGB != null ? r.memoryGB + ' GB' : 'not reported'}`,
    `CPU threads: ${r.cpuThreads ?? 'not reported'}`,
    `Data Saver: ${r.saveData ? 'on' : 'off'}`,
    `mode: ${r.lite ? 'LITE (' + r.liteReason + ')' : 'full'}`,
  ].join('\n');
}
