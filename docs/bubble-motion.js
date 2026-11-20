// The original anchors remain responsible for navigation. No click is cancelled,
// delayed, synthesised, or captured by this enhancement.
let activeController = null;

export function mountBubbleMotion(root = document.getElementById('home')) {
  destroyBubbleMotion();
  if (!root) return null;
  const bubbles = [...root.querySelectorAll('.identity-bubble')];
  if (!bubbles.length) return null;

  const controller = new AbortController();
  const { signal } = controller;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const variables = ['--bubble-mouse-x', '--bubble-mouse-y', '--bubble-tilt', '--bubble-light-x', '--bubble-light-y'];
  const records = new Map(bubbles.map(element => {
    const surface = document.createElement('div');
    surface.className = 'bubble-surface';
    surface.append(...element.childNodes);
    element.append(surface);
    return [element, { element, surface, pointerId: null, bounds: null }];
  }));
  let frame = 0;
  let pendingMove = null;

  const clearPosition = record => variables.forEach(name => record.element.style.removeProperty(name));
  function reset(record) {
    record.pointerId = null;
    record.bounds = null;
    record.element.classList.remove('is-bubble-hover', 'is-bubble-pressed');
    clearPosition(record);
    if (pendingMove?.record === record) pendingMove = null;
  }
  function resetAll() {
    cancelAnimationFrame(frame);
    frame = 0;
    pendingMove = null;
    records.forEach(reset);
  }
  function flushMove() {
    frame = 0;
    const move = pendingMove;
    pendingMove = null;
    if (!move || reduced.matches || root.hidden || !move.record.element.classList.contains('is-bubble-hover')) return;
    const { record, clientX, clientY } = move;
    const rect = record.bounds;
    if (!rect?.width || !rect.height) return;
    const x = Math.max(-1, Math.min(1, (clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (clientY - rect.top) / rect.height * 2 - 1));
    const style = record.element.style;
    style.setProperty('--bubble-mouse-x', `${(x * 5).toFixed(2)}px`);
    style.setProperty('--bubble-mouse-y', `${(y * 3).toFixed(2)}px`);
    style.setProperty('--bubble-tilt', `${(x * 2.4).toFixed(2)}deg`);
    style.setProperty('--bubble-light-x', `${(50 + x * 27).toFixed(1)}%`);
    style.setProperty('--bubble-light-y', `${(40 + y * 23).toFixed(1)}%`);
  }
  function queueMove(record, event) {
    if (reduced.matches || !record.element.classList.contains('is-bubble-hover')) return;
    pendingMove = { record, clientX: event.clientX, clientY: event.clientY };
    if (!frame) frame = requestAnimationFrame(flushMove);
  }
  function enter(record, event) {
    if (root.hidden || event.pointerType !== 'mouse' || !finePointer.matches) return;
    // The anchor never moves; its child surface handles the visual animation.
    record.bounds = record.element.getBoundingClientRect();
    record.element.classList.add('is-bubble-hover');
    queueMove(record, event);
  }
  function release(event) {
    records.forEach(record => {
      if (record.pointerId !== event.pointerId) return;
      record.pointerId = null;
      record.element.classList.remove('is-bubble-pressed');
      if (event.type === 'pointercancel' || event.pointerType !== 'mouse') reset(record);
    });
  }

  records.forEach(record => {
    const { element } = record;
    element.addEventListener('pointerenter', event => enter(record, event), { signal, passive: true });
    element.addEventListener('pointermove', event => {
      if (!element.classList.contains('is-bubble-hover')) enter(record, event);
      else queueMove(record, event);
    }, { signal, passive: true });
    element.addEventListener('pointerleave', () => reset(record), { signal, passive: true });
    element.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      record.pointerId = event.pointerId;
      element.classList.add('is-bubble-pressed');
    }, { signal, passive: true });
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.repeat) element.classList.add('is-bubble-pressed');
    }, { signal });
    element.addEventListener('keyup', event => {
      if (event.key === 'Enter') element.classList.remove('is-bubble-pressed');
    }, { signal });
    element.addEventListener('blur', () => reset(record), { signal });
  });
  window.addEventListener('pointerup', release, { signal, passive: true });
  window.addEventListener('pointercancel', release, { signal, passive: true });
  window.addEventListener('hashchange', resetAll, { signal });
  window.addEventListener('blur', resetAll, { signal });
  window.addEventListener('pagehide', resetAll, { signal });
  window.addEventListener('resize', resetAll, { signal, passive: true });
  window.addEventListener('scroll', resetAll, { signal, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetAll(); }, { signal });
  reduced.addEventListener('change', resetAll, { signal });
  finePointer.addEventListener('change', resetAll, { signal });
  root.dataset.bubbleMotion = 'ready';

  activeController = {
    destroy() {
      controller.abort();
      resetAll();
      records.forEach(({ element, surface }) => {
        if (surface.parentNode === element) surface.replaceWith(...surface.childNodes);
      });
      delete root.dataset.bubbleMotion;
    }
  };
  return activeController;
}

export function destroyBubbleMotion() {
  activeController?.destroy();
  activeController = null;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mountBubbleMotion(), { once: true });
} else {
  mountBubbleMotion();
}
