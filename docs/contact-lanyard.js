const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toRadians = Math.PI / 180;

/** Tie the ends of two SVG cords to the moving anchor of a real HTML badge. */
export function mountContactLanyard(stage) {
  if (!stage) return () => {};
  const card = stage.querySelector('[data-lanyard-card]');
  const rope = stage.querySelector('[data-lanyard-rope]');
  if (!card || !rope) return () => {};

  const knot = rope.querySelector('[data-lanyard-knot]');
  const restMarker = stage.querySelector('[data-lanyard-rest]');
  const grip = card.matches('[data-lanyard-grip]') ? card : card.querySelector('[data-lanyard-grip]');
  const cords = [-1, 1].map(side => ({
    side, paths: [...rope.querySelectorAll(side < 0 ? '[data-cord-left]' : '[data-cord-right]')], previous: '',
  }));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  const pose = {x: 0, y: 0, angle: 0, vx: 0, vy: 0, angularVelocity: 0};
  const resting = {x: 0, y: 0, angle: 0};
  let width = 0, height = 0, cardWidth = 0, cardHeight = 0;
  let raf = 0, previousFrame = 0, dropping = false, drag = null, mounted = false;

  function draw() {
    const {x, y, angle, vx} = pose;
    card.style.setProperty('--badge-x', `${x.toFixed(2)}px`);
    card.style.setProperty('--badge-y', `${y.toFixed(2)}px`);
    card.style.setProperty('--badge-angle', `${angle.toFixed(2)}deg`);
    knot?.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)})`);

    const sin = Math.sin(angle * toRadians);
    const cos = Math.cos(angle * toRadians);
    for (const cord of cords) {
      const {side, paths} = cord;
      // Keep the visible braid stitched to the knot, even when the badge rolls.
      const endX = x + side * 5 * cos + 16 * sin;
      const endY = y + side * 5 * sin - 16 * cos;
      const originX = resting.x + side * (width < 460 ? 14 : 20);
      const originY = -18;
      const delta = endX - originX;
      const span = endY - originY;
      const bow = clamp(-vx * .045, -38, 38);
      const firstX = originX + delta * .13 + side * 3;
      const secondX = endX - delta * .25 + bow;
      const values = [firstX, originY + span * .38, secondX, originY + span * .76, endX, endY];
      const path = `M ${originX.toFixed(1)} ${originY} C ${values.map(value=>value.toFixed(1)).join(' ')}`;
      if (path === cord.previous) continue;
      cord.previous = path;
      for (const layer of paths) layer.setAttribute('d', path);
    }
  }

  function target() {
    if (!drag) return resting;
    return {x: drag.x, y: drag.y, angle: resting.angle - (drag.x - resting.x) * .055};
  }

  function snap(destination) {
    Object.assign(pose, destination, {vx: 0, vy: 0, angularVelocity: 0});
    draw();
  }

  function boundedPoint(x, y) {
    const horizontalMargin = Math.min(width / 2, cardWidth / 2 - Math.min(cardWidth * .11, 30));
    return {
      x: clamp(x, horizontalMargin, width - horizontalMargin),
      y: clamp(y, 22, Math.max(22, height - cardHeight - 8)),
    };
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = previousFrame = 0;
  }

  function wake() {
    if (!raf && mounted && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function step(dt) {
    const destination = target();
    const lateralSpring = drag ? 130 : 22;
    const lateralDrag = drag ? 19 : 5.8;
    pose.vx += ((destination.x - pose.x) * lateralSpring - pose.vx * lateralDrag) * dt;
    pose.x += pose.vx * dt;

    if (dropping) {
      pose.vy = Math.min(1420, pose.vy + 2400 * dt);
      pose.y += pose.vy * dt;
      if (pose.y >= resting.y - 9) {
        pose.y = resting.y - 9;
        pose.vy *= .28;
        dropping = false;
      }
    } else {
      const verticalSpring = drag ? 140 : 46;
      const verticalDrag = drag ? 20 : 8.2;
      pose.vy += ((destination.y - pose.y) * verticalSpring - pose.vy * verticalDrag) * dt;
      pose.y += pose.vy * dt;
    }

    const tilt = clamp(destination.angle + pose.vx * .057, -22, 22);
    pose.angularVelocity += ((tilt - pose.angle) * 58 - pose.angularVelocity * 12) * dt;
    pose.angle += pose.angularVelocity * dt;
  }

  function frame(now) {
    raf = 0;
    if (motion.matches) {
      dropping = false;
      snap(target());
      previousFrame = 0;
      return;
    }
    const dt = previousFrame ? clamp((now - previousFrame) / 1000, 0, 1 / 26) : 1 / 60;
    previousFrame = now;
    // Two substeps keep the spring stable when a tab is busy or changes frame rate.
    step(dt / 2);
    step(dt / 2);
    const destination = target();
    const moving = dropping || Math.abs(pose.x - destination.x) > .15 || Math.abs(pose.y - destination.y) > .15
      || Math.abs(pose.angle - destination.angle) > .1 || Math.abs(pose.vx) + Math.abs(pose.vy) + Math.abs(pose.angularVelocity) > 1;
    if (moving) {
      draw();
      wake();
    } else {
      snap(destination);
      previousFrame = 0;
    }
  }

  function measure() {
    const nextWidth = stage.clientWidth;
    const nextHeight = stage.clientHeight;
    if (nextWidth < 1 || nextHeight < 1) return;
    width = nextWidth;
    height = nextHeight;
    cardWidth = card.offsetWidth;
    cardHeight = card.offsetHeight;
    const previousX = resting.x;
    const previousY = resting.y;
    resting.x = width / 2;
    resting.y = clamp(restMarker?.offsetTop ?? height * .42, 26, Math.max(26, height - cardHeight - 24));
    resting.angle = width < 500 ? -5 : -7;
    rope.setAttribute('viewBox', `0 0 ${width} ${height}`);

    if (!mounted) {
      mounted = true;
      if (motion.matches) {
        snap(resting);
        return;
      }
      pose.x = resting.x - Math.min(width * .055, 27);
      pose.y = -cardHeight - 30;
      pose.angle = 13;
      pose.vx = 30;
      dropping = true;
    } else {
      pose.x += resting.x - previousX;
      if (!dropping) pose.y += resting.y - previousY;
      if (drag) Object.assign(drag, boundedPoint(drag.x, drag.y));
    }
    draw();
    wake();
  }

  function onPointerDown(event) {
    if (event.button !== 0 || drag || !mounted) return;
    const insideGrip = grip?.contains(event.target);
    const control = event.target.closest('a, button, input, textarea, select, [data-lanyard-no-drag]');
    if (control && control !== grip) return;
    if (insideGrip && grip !== card) grip.focus({preventScroll: true});
    dropping = false;
    const point = boundedPoint(pose.x, pose.y);
    drag = {id: event.pointerId, ...point, offsetX: event.clientX - pose.x, offsetY: event.clientY - pose.y};
    card.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
    pose.vx *= .35;
    pose.vy *= .35;
    if (motion.matches) snap(target());
    else wake();
  }

  function onPointerMove(event) {
    if (!drag || drag.id !== event.pointerId) return;
    Object.assign(drag, boundedPoint(event.clientX - drag.offsetX, event.clientY - drag.offsetY));
    if (motion.matches) snap(target());
    else wake();
  }

  function onPointerUp(event) {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    stage.classList.remove('is-dragging');
    if (card.hasPointerCapture(event.pointerId)) card.releasePointerCapture(event.pointerId);
    if (motion.matches) snap(resting);
    else wake();
  }

  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || drag) return;
    const impulse = event.shiftKey ? 340 : 230;
    switch (event.key) {
      case 'ArrowLeft': pose.vx -= impulse; break;
      case 'ArrowRight': pose.vx += impulse; break;
      case 'ArrowUp': pose.vy -= impulse; break;
      case 'ArrowDown': pose.vy += impulse; break;
      case 'Home': dropping = false; stop(); snap(resting); break;
      default: return;
    }
    event.preventDefault();
    dropping = false;
    if (motion.matches) snap(resting);
    else wake();
  }

  const listen = (element, type, callback) => element?.addEventListener(type, callback, {signal: listeners.signal});
  listen(card, 'pointerdown', onPointerDown);
  listen(card, 'pointermove', onPointerMove);
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(card, event, onPointerUp);
  listen(grip, 'keydown', onKeyDown);
  listen(motion, 'change', () => {
    if (motion.matches) {
      stop();
      dropping = false;
      snap(target());
    } else wake();
  });
  listen(document, 'visibilitychange', () => {if (document.hidden) stop(); else wake();});
  const observer = new ResizeObserver(measure);
  observer.observe(stage);
  observer.observe(card);
  measure();

  return () => {
    const pointer = drag?.id;
    drag = null;
    listeners.abort();
    observer.disconnect();
    stop();
    if (pointer !== undefined && card.hasPointerCapture(pointer)) card.releasePointerCapture(pointer);
    stage.classList.remove('is-dragging');
  };
}
