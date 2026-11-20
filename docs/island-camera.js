const MIN_ELEVATION = 0.26;
const MAX_ELEVATION = 1.24;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 4.25;
const DRAG_THRESHOLD = 6;

export function createIslandCamera({THREE, camera, canvas, onPoint, onHover, onSelect, reduced = false, frame = {}}) {
  const initial = {
    azimuth: frame.azimuth ?? 0.63,
    elevation: frame.elevation ?? 0.68,
    zoom: 1,
    center: new THREE.Vector3(...(frame.center ?? [0, 0.4, 0])),
  };
  const current = {...initial, center: initial.center.clone()};
  const target = {...initial, center: initial.center.clone()};
  const {clamp} = THREE.MathUtils;
  const events = new AbortController();
  const pointers = new Map();
  let projection = {width: 1, height: 1};
  let viewport = {width: 1, height: 1};
  let dirty = true;
  let dragged = false;
  let pinchDistance = 0;
  let mouseLocation = null;
  let hovered = null;

  function setHover(id) {
    const value = id ?? null;
    if (value === hovered) return;
    hovered = value;
    onHover?.(value);
  }

  function detectHover() {
    if (!pointers.size && mouseLocation) {
      setHover(onPoint?.(mouseLocation.x, mouseLocation.y));
    }
  }

  function resize(width, height) {
    viewport.width = Math.max(1, width);
    viewport.height = Math.max(1, height);
    const aspect = viewport.width / viewport.height;
    projection.height = Math.max(frame.height ?? 21, (frame.width ?? 29) / aspect);
    projection.width = projection.height * aspect;
    placeCamera();
    dirty = true;
  }

  function placeCamera() {
    const distance = 45;
    const horizontal = distance * Math.cos(current.elevation);
    camera.position.set(
      current.center.x + horizontal * Math.sin(current.azimuth),
      current.center.y + distance * Math.sin(current.elevation),
      current.center.z + horizontal * Math.cos(current.azimuth),
    );
    camera.lookAt(current.center);
    camera.left = -projection.width / (2 * current.zoom);
    camera.right = -camera.left;
    camera.bottom = -projection.height / (2 * current.zoom);
    camera.top = -camera.bottom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function ease(from, to, factor) {
    return Math.abs(from - to) < 0.0001 ? to : from + (to - from) * factor;
  }

  function tick(delta = 1 / 60) {
    const motionDisabled = typeof reduced === 'object' ? reduced.matches : reduced;
    const factor = motionDisabled ? 1 : 1 - Math.exp(-12 * clamp(delta, 0, 0.05));
    const azimuth = ease(current.azimuth, target.azimuth, factor);
    const elevation = ease(current.elevation, target.elevation, factor);
    const zoom = ease(current.zoom, target.zoom, factor);
    const x = ease(current.center.x, target.center.x, factor);
    const y = ease(current.center.y, target.center.y, factor);
    const z = ease(current.center.z, target.center.z, factor);
    const moved = azimuth !== current.azimuth || elevation !== current.elevation || zoom !== current.zoom
      || x !== current.center.x || y !== current.center.y || z !== current.center.z;
    if (!dirty && !moved) return false;
    current.azimuth = azimuth;
    current.elevation = elevation;
    current.zoom = zoom;
    current.center.set(x, y, z);
    placeCamera();
    dirty = false;
    detectHover();
    return true;
  }

  function rotate(x, y) {
    target.azimuth -= x * 0.006;
    target.elevation = clamp(target.elevation + y * 0.006, MIN_ELEVATION, MAX_ELEVATION);
  }

  function zoomBy(factor, anchor) {
    const next = clamp(target.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    if (next === target.zoom) return;
    if (anchor) {
      // Keep the point under the cursor steady as the ortho camera zooms. Move
      // along the ground plane so the center stays at a consistent height.
      const rect = canvas.getBoundingClientRect();
      const shift = 1 / target.zoom - 1 / next;
      const x = clamp((anchor.x - rect.left) / rect.width - 0.5, -0.5, 0.5) * projection.width * shift;
      const z = clamp((anchor.y - rect.top) / rect.height - 0.5, -0.5, 0.5) * projection.height * shift / Math.sin(target.elevation);
      const sin = Math.sin(target.azimuth);
      const cos = Math.cos(target.azimuth);
      target.center.x += x * cos + z * sin;
      target.center.z += -x * sin + z * cos;
    }
    target.zoom = next;
    const offset = Math.max(0, 1 - 1 / next);
    const xLimit = (frame.width ?? 29) * 0.55 * offset;
    const zLimit = (frame.height ?? 21) * 0.75 * offset;
    target.center.x = clamp(target.center.x, initial.center.x - xLimit, initial.center.x + xLimit);
    target.center.z = clamp(target.center.z, initial.center.z - zLimit, initial.center.z + zLimit);
    if (next <= 1) target.center.y = initial.center.y;
  }

  function reset() {
    target.azimuth = initial.azimuth;
    // Reset along the shortest arc after a full rotation.
    current.azimuth += Math.round((initial.azimuth - current.azimuth) / (2 * Math.PI)) * 2 * Math.PI;
    target.elevation = initial.elevation;
    target.zoom = initial.zoom;
    target.center.copy(initial.center);
  }

  function focus(position, zoom = 1.6) {
    target.center.copy(position);
    target.zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  }

  function pinch() {
    const [a, b] = pointers.values();
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDistance > 0 && distance > 0) {
      zoomBy(distance / pinchDistance, {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2});
    }
    pinchDistance = distance;
  }

  const listen = (name, handler, options = {}) => canvas.addEventListener(name, handler, {...options, signal: events.signal});
  listen('pointerdown', event => {
    if (event.button !== 0 || pointers.size >= 2) return;
    if (!pointers.size) dragged = false;
    const {clientX: x, clientY: y} = event;
    pointers.set(event.pointerId, {x, y, startX: x, startY: y});
    canvas.setPointerCapture(event.pointerId);
    if (event.pointerType !== 'mouse') mouseLocation = null;
    if (pointers.size === 2) {
      dragged = true;
      canvas.classList.add('is-dragging');
      setHover(null);
      pinchDistance = 0;
      pinch();
    }
  });

  listen('pointermove', event => {
    const {clientX: x, clientY: y} = event;
    if (event.pointerType === 'mouse') mouseLocation = {x, y};
    const pointer = pointers.get(event.pointerId);
    if (!pointer) {
      detectHover();
      return;
    }
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    pointer.x = x;
    pointer.y = y;
    if (pointers.size === 2) {
      pinch();
      return;
    }
    if (!dragged && Math.hypot(x - pointer.startX, y - pointer.startY) < DRAG_THRESHOLD) return;
    if (!dragged) {
      dragged = true;
      canvas.classList.add('is-dragging');
      setHover(null);
      rotate(x - pointer.startX, y - pointer.startY);
    } else {
      rotate(dx, dy);
    }
  });

  function finishPointer(event, canceled) {
    const pointer = pointers.get(event.pointerId);
    if (!pointers.delete(event.pointerId)) return;
    pinchDistance = 0;
    if (pointers.size) return;
    canvas.classList.remove('is-dragging');
    if (canceled) {
      mouseLocation = null;
      setHover(null);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const {clientX: x, clientY: y} = event;
    const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    mouseLocation = inside && event.pointerType === 'mouse' ? {x, y} : null;
    if (!dragged && inside && Math.hypot(x - pointer.startX, y - pointer.startY) < DRAG_THRESHOLD) {
      const id = onPoint?.(x, y);
      if (id) onSelect?.(id);
    }
    detectHover();
  }

  listen('pointerup', event => finishPointer(event, false));
  listen('pointercancel', event => finishPointer(event, true));
  listen('lostpointercapture', event => finishPointer(event, true));
  listen('pointerleave', () => {
    mouseLocation = null;
    setHover(null);
  });
  listen('wheel', event => {
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.height : 1;
    const delta = clamp(event.deltaY * scale, -190, 190);
    zoomBy(Math.exp(-delta * 0.002), {x: event.clientX, y: event.clientY});
  }, {passive: false});
  listen('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    switch (event.key) {
      case 'ArrowLeft': rotate(28, 0); break;
      case 'ArrowRight': rotate(-28, 0); break;
      case 'ArrowUp': rotate(0, 24); break;
      case 'ArrowDown': rotate(0, -24); break;
      case '+':
      case '=': zoomBy(1.22); break;
      case '-': zoomBy(1 / 1.22); break;
      case 'Home': reset(); break;
      default: return;
    }
    event.preventDefault();
  });

  resize(canvas.clientWidth, canvas.clientHeight);

  return {
    tick, resize, reset, focus,
    isOverview() {
      return Math.abs(target.azimuth - initial.azimuth) < 0.001
        && Math.abs(target.elevation - initial.elevation) < 0.001
        && Math.abs(target.zoom - initial.zoom) < 0.001
        && target.center.distanceToSquared(initial.center) < 0.000001;
    },
    dispose() {
      events.abort();
      for (const id of pointers.keys()) {
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      }
      pointers.clear();
      canvas.classList.remove('is-dragging');
      setHover(null);
    },
  };
}
