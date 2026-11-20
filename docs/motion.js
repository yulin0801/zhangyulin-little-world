const intro = document.getElementById('intro');
const content = document.getElementById('site-content');
const homeTitle = document.getElementById('island-title');
const skip = document.getElementById('skip-intro');
const skipLink = document.querySelector('body > .skip-link');
const portrait = intro.querySelector('.thread-portrait');
const outline = portrait.querySelector('[data-portrait-main]');
const details = [...portrait.querySelectorAll('[data-portrait-detail]')];
const bridge = intro.querySelector('.thread-bridge');
const entry = bridge.querySelector('[data-thread-entry]');
const exit = bridge.querySelector('[data-thread-exit]');
const greeting = intro.querySelector('.thread-copy');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const sessionKey = 'yulin-thread-intro-seen';
const slideDuration = 820;
const timeline = { entry: 630, outline: 2290, details: 3050, exit: 4020, slide: 4650 };
let active;

const isHome = () => /^#?\/?(?:home)?(?:\?.*)?$/.test(location.hash);
const clamp = value => Math.min(1, Math.max(0, value));

function shapeBridges() {
  const matrix = outline.getScreenCTM();
  if (!matrix) return;
  const { width, height } = intro.getBoundingClientRect();
  const top = outline.getPointAtLength(0).matrixTransform(matrix);
  const shoulder = outline.getPointAtLength(outline.getTotalLength()).matrixTransform(matrix);
  const endX = width / 2;
  const stacked = portrait.getBoundingClientRect().bottom <= greeting.getBoundingClientRect().top + 4;
  bridge.setAttribute('viewBox', [0, 0, width, height].join(' '));
  entry.setAttribute('d', [
    'M', Math.min(width - 15, top.x + (stacked ? 16 : 38)), -4,
    'C', top.x + (stacked ? 31 : 58), top.y * .34, top.x + 8, top.y * .65, top.x, top.y,
  ].join(' '));
  if (stacked) {
    const left = Math.max(18, greeting.getBoundingClientRect().left - 15);
    const turn = greeting.getBoundingClientRect().bottom + 24;
    exit.setAttribute('d', [
      'M', shoulder.x, shoulder.y,
      'C', shoulder.x - 22, shoulder.y + 13, left - 1, shoulder.y + 22, left, shoulder.y + 50,
      'C', left + 3, turn, endX, turn - 12, endX, height + 1,
    ].join(' '));
  } else {
    exit.setAttribute('d', [
      'M', shoulder.x, shoulder.y,
      'C', shoulder.x - 12, shoulder.y + 34, shoulder.x + 46, height * .79, endX - 54, height * .85,
      'S', endX, height * .94, endX, height + 1,
    ].join(' '));
  }
}

function draw(path, fraction) {
  const progress = clamp(fraction);
  path.style.visibility = progress > 0 ? 'visible' : '';
  path.style.strokeDashoffset = String(1 - progress);
}

function finish() {
  const run = active;
  if (!run) return;
  active = null;
  cancelAnimationFrame(run.frame);
  clearTimeout(run.timeout);
  clearTimeout(run.watchdog);
  const moveFocus = run.replay || document.activeElement === skip;
  intro.hidden = true;
  intro.classList.remove('is-sliding');
  delete intro.dataset.phase;
  document.body.classList.remove('intro-running');
  content.inert = run.contentWasInert;
  skipLink.inert = run.skipLinkWasInert;
  if (moveFocus && isHome()) homeTitle?.focus({ preventScroll: true });
}

function slideToIslands(run) {
  intro.dataset.phase = 'leaving';
  intro.classList.add('is-sliding');
  run.timeout = setTimeout(finish, slideDuration + 50);
}

function start(replay = false) {
  if (active || (reduced.matches && !replay)) return;
  const run = {
    replay,
    contentWasInert: content.inert,
    skipLinkWasInert: skipLink.inert,
    frame: 0,
  };
  active = run;
  intro.hidden = false;
  intro.dataset.phase = 'entry';
  document.body.classList.add('intro-running');
  content.inert = true;
  skipLink.inert = true;
  skip.textContent = '跳过开场';
  greeting.classList.remove('is-revealed');
  for (const path of [entry, outline, ...details, exit]) {
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1';
    draw(path, 0);
  }
  shapeBridges();
  if (replay) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    skip.focus({ preventScroll: true });
  }
  if (reduced.matches) {
    intro.dataset.phase = 'greeting';
    for (const path of [entry, outline, ...details, exit]) draw(path, 1);
    greeting.classList.add('is-revealed');
    skip.textContent = '进入主页';
    return;
  }

  const started = performance.now();
  function animate(now) {
    const time = now - started;
    draw(entry, time / timeline.entry);
    draw(outline, (time - timeline.entry) / (timeline.outline - timeline.entry));
    const detailProgress = (time - timeline.outline) / (timeline.details - timeline.outline);
    details.forEach((path, index) => draw(path, (detailProgress - index * .22) / .56));
    draw(exit, (time - timeline.exit) / (timeline.slide - timeline.exit));
    if (time >= timeline.outline + 140) greeting.classList.add('is-revealed');

    if (time >= timeline.slide) {
      slideToIslands(run);
      return;
    }
    intro.dataset.phase = time >= timeline.exit ? 'exit'
      : time >= timeline.outline ? 'greeting'
      : time >= timeline.entry ? 'portrait'
      : 'entry';
    run.frame = requestAnimationFrame(animate);
  }
  run.frame = requestAnimationFrame(animate);
  run.watchdog = setTimeout(finish, timeline.slide + slideDuration + 350);
}

skip.addEventListener('click', finish);
document.querySelectorAll('[data-replay-intro]').forEach(button => button.addEventListener('click', () => {
  if (isHome()) {
    start(true);
    return;
  }
  window.addEventListener('hashchange', () => { if (isHome()) start(true); }, { once: true });
  location.hash = '/home';
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && active) {
    event.preventDefault();
    finish();
  }
});
window.addEventListener('hashchange', () => { if (active && !isHome()) finish(); });
window.addEventListener('resize', () => {
  if (active && intro.dataset.phase !== 'leaving') shapeBridges();
});
reduced.addEventListener('change', () => { if (reduced.matches && active) finish(); });

if (isHome()) {
  let seen = false;
  try {
    seen = sessionStorage.getItem(sessionKey) === '1';
    sessionStorage.setItem(sessionKey, '1');
  } catch { /* The opening can play without session storage. */ }
  if (!seen) start();
}
