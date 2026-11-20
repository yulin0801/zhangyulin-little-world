import { runPaperIntro } from './paper-intro.js?v=7.0';
import { createWelcomeWriter } from './welcome-intro.js?v=7.0';

const intro = document.getElementById('intro');
const content = document.getElementById('site-content');
const homeTitle = document.getElementById('island-title');
const skip = document.getElementById('skip-intro');
const skipLink = document.querySelector('body > .skip-link');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const MAX_DURATION = 4900;
const SESSION_KEY = 'yulin-intro-v7-seen';
let active = null;

const isHome = () => {
  const route = location.hash.replace(/^#\/?/, '');
  return route === '' || route === 'home';
};

function finalize(run) {
  if (active !== run || run.finished) return;
  run.finished = true;
  clearTimeout(run.watchdog);
  clearTimeout(run.pause);
  clearTimeout(run.fade);
  run.paper?.destroy();
  run.writer?.destroy();
  intro.hidden = true;
  intro.classList.remove('leaving');
  delete intro.dataset.phase;
  document.body.classList.remove('intro-running');
  content.inert = false;
  if (skipLink) skipLink.inert = run.skipLinkWasInert;
  active = null;
  if (run.returnFocus && isHome()) homeTitle?.focus({ preventScroll: true });
}

function completeIntro(run, immediate = false) {
  if (!run || active !== run || run.finished) return;
  if (run.finishing) {
    if (immediate) finalize(run);
    return;
  }
  run.finishing = true;
  run.returnFocus = run.fromReplay || document.activeElement === skip;
  clearTimeout(run.pause);
  clearTimeout(run.watchdog);
  run.paper?.destroy();
  if (immediate || reduced.matches) {
    finalize(run);
    return;
  }
  // Preserve the completed lettering through the dissolve; remove it afterwards.
  document.body.classList.remove('intro-running');
  content.inert = false;
  intro.dataset.phase = 'leaving';
  intro.classList.add('leaving');
  const remaining = Math.max(0, MAX_DURATION - (performance.now() - run.started));
  run.fade = setTimeout(() => finalize(run), Math.min(480, remaining));
}

function startWriting(run) {
  if (active !== run || run.writing || run.finishing || run.finished) return;
  run.writing = true;
  intro.dataset.phase = 'writing';
  try { run.writer.start({ duration: 1850 }); }
  catch { completeIntro(run, true); }
}

function startIntro(fromReplay = false) {
  if (active || !intro.hidden || reduced.matches) return;
  const run = {
    started: performance.now(), fromReplay, returnFocus: false,
    finishing: false, finished: false, writing: false,
    paper: null, writer: null, watchdog: 0, pause: 0, fade: 0,
    skipLinkWasInert: skipLink?.inert || false,
  };
  active = run;
  intro.hidden = false;
  intro.dataset.phase = 'paper';
  intro.classList.remove('leaving');
  document.body.classList.add('intro-running');
  content.inert = true;
  if (skipLink) skipLink.inert = true;
  if (fromReplay) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    skip.focus({ preventScroll: true });
  }
  run.watchdog = setTimeout(() => completeIntro(run, true), MAX_DURATION);
  try {
    run.writer = createWelcomeWriter(intro, {
      onComplete: () => {
        if (active !== run || run.finishing || run.finished) return;
        run.pause = setTimeout(() => completeIntro(run), 180);
      },
    });
    run.paper = runPaperIntro(document.getElementById('paper-canvas'), {
      onUnfold: () => startWriting(run),
      // WebGL unavailability also arrives here, revealing the cream sheet and
      // continuing with handwriting alone. The state guard prevents two starts.
      onComplete: () => startWriting(run),
    });
  } catch { completeIntro(run, true); }
}

skip.addEventListener('click', () => completeIntro(active, true));
document.querySelectorAll('[data-replay-intro]').forEach(button => button.addEventListener('click', () => {
  location.hash = '/home';
  startIntro(true);
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && active) {
    event.preventDefault();
    completeIntro(active, true);
  }
});
// Routing never starts an intro. If a route changes during playback, let the
// requested page take precedence over the decorative sequence.
window.addEventListener('hashchange', () => {
  if (active && !isHome()) completeIntro(active, true);
});
reduced.addEventListener('change', () => {
  if (reduced.matches && active) completeIntro(active, true);
});

let visited = false;
try { visited = sessionStorage.getItem(SESSION_KEY) === '1'; }
catch { /* Storage can be unavailable; routes still never replay the intro. */ }
if (!visited && isHome()) {
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
  startIntro();
}
