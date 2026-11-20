/** Seven connected lowercase letters; a custom pen centreline, not a font outline. */
export const WELCOME_PATH = `M 80 182
 C 101 175,115 157,123 143 C 117 161,105 194,116 207
 C 131 222,154 181,163 151 C 157 178,146 205,159 211
 C 174 218,191 181,199 156 C 195 172,192 186,201 190
 C 211 195,221 182,229 174
 C 258 165,266 147,251 144 C 236 141,216 160,216 180
 C 216 204,236 217,255 204 C 271 193,282 179,291 166
 C 316 129,347 83,336 63 C 322 38,299 88,288 134
 C 278 175,277 200,291 208 C 306 217,323 190,331 177
 C 345 155,371 140,382 153 C 368 144,347 153,337 176
 C 325 205,349 217,371 207 C 390 197,401 180,413 164
 C 400 153,387 176,391 195 C 398 219,426 205,436 182
 C 447 157,429 148,413 164 C 425 180,441 179,454 166
 C 462 155,470 147,475 152 C 480 158,463 193,459 207
 C 469 180,483 149,495 151 C 509 153,492 192,490 207
 C 501 180,516 152,528 155 C 542 160,524 194,531 205
 C 541 217,556 192,567 178
 C 596 169,609 149,594 147 C 578 144,562 165,562 186
 C 562 211,587 217,609 202 C 632 188,644 167,668 160
 C 684 155,699 158,706 163`;

/** Mount once per playback. Destroy removes its node and cancels every frame. */
export function createWelcomeWriter(host, { onComplete = () => {} } = {}) {
  const element = document.createElement('div');
  element.className = 'welcome-writing';
  element.hidden = true;
  element.dataset.progress = '0';
  element.setAttribute('aria-hidden', 'true');
  element.innerHTML = `<svg viewBox="50 30 690 220" fill="none" focusable="false">
    <path class="welcome-ink" pathLength="1000" d="${WELCOME_PATH}"
      stroke-dasharray="1000" stroke-dashoffset="1000"/>
  </svg>`;
  host.appendChild(element);
  const ink = element.querySelector('path');
  let frame = 0;
  let running = false;
  let destroyed = false;
  let completed = false;

  function finish() {
    if (completed || destroyed) return;
    completed = true;
    running = false;
    ink.style.strokeDashoffset = '0';
    element.dataset.progress = '1';
    onComplete();
  }

  function start({ duration = 1850 } = {}) {
    if (running || completed || destroyed) return;
    running = true;
    element.hidden = false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    const started = performance.now();
    function draw(now) {
      if (destroyed || completed) return;
      const t = Math.max(0, Math.min(1, (now - started) / duration));
      // Almost constant pen speed, with a gentle start/finish and subtle rhythm.
      // A single dash offset follows the actual connected stroke, including loops.
      const smooth = t * t * (3 - 2 * t);
      const rhythm = Math.sin(t * Math.PI * 14) * Math.sin(t * Math.PI) * .0025;
      const progress = Math.max(0, Math.min(1, t * .92 + smooth * .08 + rhythm));
      ink.style.strokeDashoffset = String((1 - progress) * 1000);
      element.dataset.progress = progress.toFixed(3);
      if (t >= 1) finish();
      else frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(frame);
    element.remove();
  }

  return { start, destroy };
}
