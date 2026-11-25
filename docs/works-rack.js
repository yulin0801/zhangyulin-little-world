const START_ANGLE = 34;
const FACES = [0, 3, 1, 2];
const TIERS = 3;
const MIN_ZOOM = .5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = .25;
const COVER_COLORS = ['#f5d9c7', '#d2d7eb', '#dbb5c6', '#d2dcd0', '#e8c4a0', '#efe2ca'];
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const modulo = (value, wrap) => ((value % wrap) + wrap) % wrap;

function coverColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return COVER_COLORS[hash % COVER_COLORS.length];
}

function booklet(entry) {
  const id = String(entry.id);
  const cover = entry.cover
    ? `<img class="rack-cover-preview" src="${escape(entry.cover)}" alt="" draggable="false" decoding="async">`
    : '';
  return `<a class="rack-booklet" href="${escape(entry.href)}" data-paper-id="${escape(id)}" title="${escape(entry.title)}"
       aria-label="${escape(entry.title)}，打开全文" style="--cover-paper:${coverColor(id)}">
    <span class="rack-booklet-inner" aria-hidden="true">
      <span class="rack-booklet-type">${escape(entry.type || '论文')}</span>
      <span class="rack-booklet-title"${entry.lang?' lang="'+escape(entry.lang)+'"':''}>${escape(entry.title)}</span>
      <span class="rack-cover-window">${cover}</span>
    </span>
  </a>`;
}

function rackMarkup(entries) {
  const levels = Array.from({length: 4}, () => Array.from({length: TIERS}, () => []));
  const tierOrder = entries.length <= 8 ? [1, 0, 2] : [0, 1, 2];
  entries.forEach((entry, index) => {
    const face = FACES[index % FACES.length];
    const row = tierOrder[Math.floor(index / FACES.length) % TIERS];
    levels[face][row].push(entry);
  });

  return `<div class="rack-actions">
    <div class="rack-turn-controls" role="group" aria-label="转动展示架">
      <button type="button" data-rack-turn="-1">上一面</button>
      <span class="rack-face-count" aria-live="polite" aria-atomic="true">1 / 4</span>
      <button type="button" data-rack-turn="1">下一面</button>
    </div>
    <div class="rack-view-controls" role="group" aria-label="调整展示架视图">
      <button type="button" data-rack-zoom="-1" aria-label="缩小展示架">−</button>
      <output class="rack-zoom-level" aria-label="缩放比例">100%</output>
      <button type="button" data-rack-zoom="1" aria-label="放大展示架">＋</button>
      <button type="button" data-rack-pan aria-pressed="false">平移</button>
      <button type="button" data-rack-reset>复位</button>
    </div>
  </div>
  <div class="rack-view" tabindex="0" role="region" aria-label="论文展示架" aria-describedby="rack-instruction">
    <div class="rack-rig">
      <div class="rack-base" aria-hidden="true"></div>
      <div class="rack-post" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="rack-spinner">
        ${levels.map((rows, side) => `<div class="rack-face" data-rack-side="${side}" style="--side-angle:${side * 90}deg">
          ${rows.map(items => `<div class="rack-tier">
            <span class="rack-tier-floor" aria-hidden="true"></span>
            <div class="rack-tier-books">${items.map(booklet).join('')}</div>
            <span class="rack-tier-wire" aria-hidden="true"></span>
          </div>`).join('')}
        </div>`).join('')}
      </div>
    </div>
  </div>
  <p class="rack-instruction" id="rack-instruction">拖动旋转，开启「平移」后可拖动移动。支持方向键和加减键。</p>`;
}

/** Mount a native CSS 3D rack. Booklets are links so the document reader owns navigation. */
export function mountWorksRack(root, entries) {
  if (!root) return () => {};
  root.hidden = !entries.length;
  if (!entries.length || !CSS.supports('transform-style', 'preserve-3d')) {
    root.hidden = true;
    root.replaceChildren();
    return () => {};
  }

  root.innerHTML = rackMarkup(entries);
  const view = root.querySelector('.rack-view');
  const spinner = root.querySelector('.rack-spinner');
  const sides = [...root.querySelectorAll('.rack-face')].map(face => ({
    face, books: [...face.querySelectorAll('a')], back: null,
  }));
  const counter = root.querySelector('.rack-face-count');
  const zoomLevel = root.querySelector('.rack-zoom-level');
  const zoomOut = root.querySelector('[data-rack-zoom="-1"]');
  const zoomIn = root.querySelector('[data-rack-zoom="1"]');
  const panButton = root.querySelector('[data-rack-pan]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const listen = (element, type, listener, options = {}) => {
    element.addEventListener(type, listener, {...options, signal: events.signal});
  };
  let angle = START_ANGLE;
  let destination = START_ANGLE;
  let frame = 0;
  let lastFrame = 0;
  let drag;
  let suppressClick = false;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let panMode = false;
  let fit = 1;
  let rackWidth = 0;
  let rackHeight = 0;

  function updateView() {
    const scale = fit * zoom;
    const maxX = Math.max(view.clientWidth * .3, (rackWidth * scale - view.clientWidth) / 2 + 48);
    const maxY = Math.max(view.clientHeight * .3, (rackHeight * scale - view.clientHeight) / 2 + 48);
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
    view.style.setProperty('--rack-scale', scale);
    view.style.setProperty('--rack-pan-x', `${panX}px`);
    view.style.setProperty('--rack-pan-y', `${panY}px`);
  }

  function fitView() {
    if (!view.clientWidth || !view.clientHeight) return;
    const face = sides[0].face;
    // Leave room for the corners projected by perspective, the post and the base.
    rackWidth = face.offsetWidth * 1.75;
    rackHeight = face.offsetHeight * 1.3;
    fit = Math.min(1, (view.clientWidth - 24) / rackWidth, (view.clientHeight - 24) / rackHeight);
    updateView();
  }

  function setZoom(value) {
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
    zoomLevel.value = `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom === MIN_ZOOM;
    zoomIn.disabled = zoom === MAX_ZOOM;
    updateView();
  }

  function resetView() {
    panX = panY = 0;
    setZoom(1);
    goTo(START_ANGLE);
  }

  const resizeObserver = new ResizeObserver(fitView);
  resizeObserver.observe(view);
  fitView();

  function update() {
    spinner.style.setProperty('--rack-angle', `${angle}deg`);
    for (const [index, side] of sides.entries()) {
      const back = Math.cos((angle + index * 90) * Math.PI / 180) <= 0.13;
      if (side.back === back) continue;
      side.back = back;
      side.face.classList.toggle('rack-face-back', back);
      side.face.toggleAttribute('inert', back);
      for (const book of side.books) book.tabIndex = back ? -1 : 0;
    }
  }

  function updateCounter() {
    const face = modulo(Math.round((START_ANGLE - angle) / 90), 4) + 1;
    const text = `${face} / 4`;
    if (counter.textContent !== text) counter.textContent = text;
  }

  function animate(now) {
    frame = 0;
    const dt = lastFrame ? Math.min(now - lastFrame, 34) : 16;
    lastFrame = now;
    const delta = destination - angle;
    if (reduce.matches || Math.abs(delta) < 0.04) {
      angle = destination;
      lastFrame = 0;
      update();
      if (!drag?.active || drag.pan) updateCounter();
      return;
    }

    angle += delta * (1 - Math.exp(-dt / (drag?.active ? 28 : 105)));
    update();
    frame = requestAnimationFrame(animate);
  }

  function goTo(value) {
    destination = value;
    if (!frame) frame = requestAnimationFrame(animate);
  }

  function turn(direction) {
    const page = Math.round((START_ANGLE - destination) / 90) + direction;
    goTo(START_ANGLE - page * 90);
  }

  listen(root, 'click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-rack-turn')) turn(Number(button.dataset.rackTurn));
    if (button.hasAttribute('data-rack-zoom')) setZoom(zoom + Number(button.dataset.rackZoom) * ZOOM_STEP);
    if (button.hasAttribute('data-rack-reset')) resetView();
    if (button === panButton) {
      panMode = !panMode;
      panButton.setAttribute('aria-pressed', String(panMode));
      view.classList.toggle('rack-pan-mode', panMode);
    }
  });
  listen(view, 'keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const directions = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
    const direction = directions[event.key];
    if (direction && (panMode || event.shiftKey)) {
      panX += direction[0] * 40;
      panY += direction[1] * 40;
      updateView();
    } else if (direction?.[0]) turn(direction[0]);
    else if (event.key === '+' || event.key === '=') setZoom(zoom + ZOOM_STEP);
    else if (event.key === '-') setZoom(zoom - ZOOM_STEP);
    else if (event.key === 'Home') resetView();
    else return;
    event.preventDefault();
  });
  listen(view, 'pointerdown', event => {
    if (drag || !event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    drag = {
      pointer: event.pointerId, startX: event.clientX, startY: event.clientY,
      lastX: event.clientX, lastTime: event.timeStamp, velocity: 0, startAngle: angle, active: false,
      pan: panMode || event.shiftKey, panX, panY,
    };
  });
  listen(window, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const distance = event.clientX - drag.startX;
    const vertical = event.clientY - drag.startY;
    if (!drag.active) {
      if (!drag.pan && Math.abs(vertical) > 8 && Math.abs(vertical) > Math.abs(distance)) {
        drag = undefined;
        return;
      }
      if (Math.hypot(distance, drag.pan ? vertical : 0) < 7) return;
      drag.active = true;
      view.setPointerCapture(event.pointerId);
      view.classList.add('rack-is-dragging');
    }
    if (drag.pan) {
      panX = drag.panX + distance;
      panY = drag.panY + vertical;
      updateView();
      return;
    }
    const velocity = (event.clientX - drag.lastX) / Math.max(event.timeStamp - drag.lastTime, 10);
    drag.velocity = drag.velocity * .43 + velocity * .57;
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
    goTo(drag.startAngle + distance * .63);
  });

  function finish(event, cancelled) {
    if (!drag || event.pointerId !== drag.pointer) return;
    const finished = drag;
    drag = undefined;
    view.classList.remove('rack-is-dragging');
    if (!finished.active) return;
    suppressClick = true;
    if (finished.pan) return;
    const recent = event.timeStamp - finished.lastTime < 120;
    const inertia = !cancelled && !reduce.matches && recent
      ? Math.max(-96, Math.min(96, finished.velocity * 95))
      : 0;
    goTo(destination + inertia);
  }

  listen(window, 'pointerup', event => finish(event, false));
  listen(window, 'pointercancel', event => finish(event, true));
  listen(view, 'lostpointercapture', event => finish(event, true));
  listen(view, 'click', event => {
    if (event.detail === 0 || !suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, {capture: true});
  listen(view, 'dragstart', event => event.preventDefault());
  for (const image of root.querySelectorAll('.rack-cover-preview')) {
    const markMissing = () => image.hidden = true;
    listen(image, 'error', markMissing);
    if (image.complete && !image.naturalWidth) markMissing();
  }

  update();
  return () => {
    events.abort();
    resizeObserver.disconnect();
    if (frame) cancelAnimationFrame(frame);
    if (drag?.active && view.hasPointerCapture(drag.pointer)) view.releasePointerCapture(drag.pointer);
    root.replaceChildren();
  };
}
