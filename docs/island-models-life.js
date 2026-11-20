export function makeLifeModels(THREE) {
  const palette = {
    ink: 0x302738, midInk: 0x514551, mauve: 0x87556c, darkRose: 0x88465a,
    pink: 0xef9db4, powder: 0xf3bbbf, pale: 0xffdcc7, cream: 0xffebcb,
    coral: 0xcd574f, orange: 0xf68d57, wine: 0x9c3849,
    teal: 0x336370, blue: 0x507e8a, mint: 0x95bcaf, floor: 0xbd927c, tile: 0xb38063,
    stock: 0xffead0, darkWindow: 0x444050, grass: 0x3b7466,
  };
  const materials = Object.fromEntries(Object.entries(palette).map(([key, color]) => [
    key, new THREE.MeshStandardMaterial({color, roughness: 0.88}),
  ]));
  Object.assign(materials, {
    goldLit: new THREE.MeshStandardMaterial({
      color: 0xffdbaa, emissive: 0xffb765, emissiveIntensity: 0.52, roughness: 0.8,
    }),
    bulb: new THREE.MeshBasicMaterial({color: 0xffe8ab}),
    roseLit: new THREE.MeshStandardMaterial({
      color: 0xffa2a5, emissive: 0xf27488, emissiveIntensity: 0.63, roughness: 0.77,
    }),
    glass: new THREE.MeshBasicMaterial({
      color: 0xffdfa7, transparent: true, opacity: 0.11, side: THREE.DoubleSide, depthWrite: false,
    }),
    glint: new THREE.MeshBasicMaterial({
      color: 0xfff3d8, transparent: true, opacity: 0.34, depthWrite: false,
    }),
  });
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  const round = new THREE.SphereGeometry(1, 12, 8);
  const box = (parent, x, y, z, w, h, d, name) => {
    const mesh = new THREE.Mesh(cube, materials[name]);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = name !== 'glass' && name !== 'glint';
    mesh.receiveShadow = name !== 'glass' && name !== 'glint';
    parent.add(mesh);
    return mesh;
  };
  const cyl = (parent, x, y, z, radius, height, name) => {
    const mesh = new THREE.Mesh(cylinder, materials[name]);
    mesh.position.set(x, y, z);
    mesh.scale.set(radius, height, radius);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const ball = (parent, x, y, z, size, name) => {
    const mesh = new THREE.Mesh(round, materials[name]);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(size);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const bar = (parent, a, b, radius, name) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start);
    const mid = start.addScaledVector(delta, 0.5);
    const mesh = cyl(parent, mid.x, mid.y, mid.z, radius, delta.length(), name);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return mesh;
  };
  const ring = (parent, x, y, z, radius, tube, name) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 6, 20), materials[name]);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const group = (parent, x = 0, y = 0, z = 0) => {
    const target = new THREE.Group();
    target.position.set(x, y, z);
    parent.add(target);
    return target;
  };
  function massBoxes(parent, examples) {
    if (examples.length === 0) return;
    const temp = new THREE.Object3D();
    const bunch = new THREE.InstancedMesh(cube, materials.stock, examples.length);
    examples.forEach(([x, y, z, w, h, d, color], index) => {
      temp.position.set(x, y, z);
      temp.scale.set(w, h, d);
      temp.updateMatrix();
      bunch.setMatrixAt(index, temp.matrix);
      bunch.setColorAt(index, new THREE.Color(color));
    });
    bunch.instanceMatrix.needsUpdate = true;
    bunch.instanceColor.needsUpdate = true;
    bunch.computeBoundingSphere();
    parent.add(bunch);
  }
  function frontWindow(parent, x, y, z, w, h, {window = 'glass', trim = 'ink', mullion = true} = {}) {
    box(parent, x, y, z, w, h, 0.018, window);
    for (const s of [-1, 1]) {
      box(parent, x + s * w / 2, y, z + 0.018, 0.035, h + 0.04, 0.044, trim);
      box(parent, x, y + s * h / 2, z + 0.018, w, 0.035, 0.044, trim);
    }
    if (mullion) box(parent, x, y, z + 0.018, 0.027, h, 0.04, trim);
    if (window === 'glass') {
      const reflection = box(parent, x + w * 0.25, y + h * 0.18, z + 0.028, 0.019, h * 0.3, 0.006, 'glint');
      reflection.rotation.z = -0.43;
    }
  }
  function wordMark(parent, x, y, z, w, h, title, color = '#5c273d') {
    const canvas = globalThis.document?.createElement('canvas');
    if (!canvas) return;
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.font = 'bold 84px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(title, canvas.width / 2, canvas.height * 0.52, 492);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({map, transparent: true, depthWrite: false});
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
  }
  function rooftopAc(parent, x, y, z) {
    box(parent, x, y, z, 0.39, 0.25, 0.26, 'midInk');
    box(parent, x, y + 0.015, z + 0.14, 0.35, 0.19, 0.025, 'cream');
    ring(parent, x - 0.063, y + 0.014, z + 0.158, 0.066, 0.013, 'ink');
    const fan = box(parent, x - 0.063, y + 0.014, z + 0.164, 0.024, 0.129, 0.012, 'midInk');
    fan.rotation.z = -0.67;
    for (let i = 0; i < 3; i++) box(parent, x + 0.088, y - 0.033 + 0.037 * i, z + 0.16, 0.079, 0.018, 0.015, 'midInk');
  }
  function shelves(parent, x, z, w, count, colors) {
    box(parent, x, 0.57, z - 0.11, w, 0.91, 0.12, 'pale');
    const goods = [];
    for (let levelIndex = 0; levelIndex < 3; levelIndex++) {
      const y = 0.26 + 0.257 * levelIndex;
      box(parent, x, y, z, w, 0.045, 0.28, 'cream');
      box(parent, x, y + 0.005, z + 0.145, w, 0.034, 0.022, 'orange');
      const spacing = (w - 0.09) / count;
      for (let i = 0; i < count; i++) {
        const dx = x - (w - 0.09) / 2 + spacing * (i + 0.5);
        const height = 0.07 + ((i + 2 * levelIndex) % 3) * 0.022;
        goods.push([dx, y + 0.024 + height / 2, z + 0.06, spacing * 0.72, height, 0.087, colors[(i + levelIndex) % colors.length]]);
        goods.push([dx, y + 0.041, z + 0.11, spacing * 0.60, 0.022, 0.014, 0xfffae8]);
      }
    }
    massBoxes(parent, goods);
  }
  function envelope(parent, x, y, z, w, h, body) {
    const face = group(parent, x, y, z);
    box(face, 0, 0, 0, w, h, 0.082, 'mauve');
    box(face, 0, 0, 0.045, w - 0.036, h - 0.031, 0.048, body);
    for (const s of [-1, 1]) {
      bar(face, [s * (w / 2 - 0.032), h / 2 - 0.029, 0.078], [0, -0.061, 0.078], 0.013, 'darkRose');
      bar(face, [s * (w / 2 - 0.033), -h / 2 + 0.032, 0.078], [0, 0.017, 0.078], 0.008, 'pink');
    }
    const seal = cyl(face, 0, -0.057, 0.087, h * 0.115, 0.023, 'coral');
    seal.rotation.x = Math.PI / 2;
    return face;
  }
  function planter(parent, x, z, flowering = false) {
    cyl(parent, x, 0.115, z, 0.135, 0.23, 'coral');
    cyl(parent, x, 0.223, z, 0.148, 0.045, 'orange');
    cyl(parent, x, 0.249, z, 0.118, 0.019, 'midInk');
    for (let i = 0; i < 5; i++) {
      const angle = 2.4 * i;
      const leaf = ball(parent, x + Math.cos(angle) * 0.076, 0.30 + i * 0.027, z + Math.sin(angle) * 0.063, 0.072, i % 2 ? 'mint' : 'grass');
      leaf.scale.y = 0.104;
      if (flowering && i % 2 === 0) ball(parent, leaf.position.x + 0.024, leaf.position.y + 0.062, leaf.position.z, 0.047, i === 0 ? 'coral' : 'pink');
    }
  }
  function life() {
    const building = new THREE.Group();
    const store = group(building, -0.16, 0, -0.28);
    box(store, 0, 0.061, 0.055, 2.34, 0.122, 2.04, 'midInk');
    box(store, 0, 0.126, 0.042, 2.24, 0.04, 1.96, 'floor');
    box(store, 0, 0.144, -0.03, 2.02, 0.012, 1.55, 'tile');
    const shopTiles = [];
    for (let row = 0; row < 6; row++) for (let column = 0; column < 8; column++) {
      if ((row + column) % 2 === 0) shopTiles.push([-0.881 + 0.252 * column, 0.153, -0.654 + 0.251 * row, 0.248, 0.006, 0.247, 0xdfb5a9]);
    }
    massBoxes(store, shopTiles);
    box(store, 0, 0.758, -0.868, 2.16, 1.23, 0.136, 'powder');
    box(store, -1.03, 0.758, -0.063, 0.14, 1.23, 1.57, 'powder');
    box(store, 1.045, 0.754, -0.520, 0.10, 1.22, 0.62, 'mauve');
    box(store, 1.051, 0.272, 0.244, 0.11, 0.268, 0.94, 'pale');
    box(store, 0, 1.274, -0.062, 2.16, 0.27, 1.77, 'cream');
    box(store, -0.62, 0.246, 0.766, 0.856, 0.20, 0.084, 'pale');
    box(store, 0.73, 0.246, 0.766, 0.62, 0.20, 0.084, 'pale');
    for (const x of [-1.06, -0.22, 0.37, 1.064]) box(store, x, 0.648, 0.765, 0.065, 1.0, 0.089, 'teal');
    frontWindow(store, -0.638, 0.722, 0.780, 0.794, 0.727, {trim: 'teal'});
    frontWindow(store, 0.722, 0.722, 0.780, 0.603, 0.727, {trim: 'teal'});
    const corner = group(store, 1.061, 0.722, 0.332);
    corner.rotation.y = Math.PI / 2;
    frontWindow(corner, 0, 0, 0, 0.84, 0.727, {trim: 'teal'});
    const doors = [-1, 1].map(side => {
      const door = group(store, 0.074 + 0.147 * side, 0.631, 0.799);
      frontWindow(door, 0, 0, 0, 0.280, 0.965, {trim: 'teal', mullion: false});
      box(door, -side * 0.076, -0.037, 0.048, 0.029, 0.138, 0.029, 'goldLit');
      return door;
    });
    let openAmount = 0;
    building.userData.animate = ({delta = 0, hovered = false, reduced = false} = {}) => {
      const target = hovered && !reduced ? 1 : 0;
      openAmount = reduced ? 0 : THREE.MathUtils.damp(openAmount, target, 5.4, delta);
      doors.forEach((door, index) => {
        door.position.x = 0.074 + (index === 0 ? -1 : 1) * (0.147 + openAmount * 0.213);
      });
    };
    box(store, 0.08, 0.151, 0.976, 0.57, 0.026, 0.223, 'teal');
    for (const x of [-0.51, 0.56]) box(store, x, 1.119, -0.081, 0.126, 0.033, 1.321, 'bulb');
    shelves(store, -0.451, -0.556, 0.962, 7, [0xf29270, 0xfff0bd, 0x79bda2, 0xf5a65b, 0x8b9fcf, 0xed8faf]);
    shelves(store, -0.658, 0.447, 0.655, 5, [0xe1a94d, 0xf297a9, 0xeac6c7, 0x88aaab, 0xec9360]);
    box(store, 0.63, 0.61, -0.627, 0.59, 0.913, 0.30, 'teal');
    box(store, 0.63, 0.62, -0.470, 0.51, 0.764, 0.028, 'goldLit');
    const drinks = [];
    for (let levelIndex = 0; levelIndex < 4; levelIndex++) {
      const y = 0.315 + 0.167 * levelIndex;
      box(store, 0.63, y - 0.04, -0.445, 0.5, 0.02, 0.039, 'pale');
      for (let i = 0; i < 7; i++) {
        drinks.push([0.417 + 0.071 * i, y, -0.427, 0.049, 0.086, 0.046, [0x4e95b5, 0xf1a845, 0xe183a3, 0x54a78c][(i + levelIndex) % 4]]);
      }
    }
    massBoxes(store, drinks);
    box(store, 0.630, 0.62, -0.392, 0.020, 0.77, 0.035, 'teal');
    box(store, 0.790, 0.365, 0.391, 0.433, 0.432, 0.378, 'teal');
    box(store, 0.790, 0.602, 0.391, 0.464, 0.079, 0.398, 'cream');
    box(store, 0.881, 0.683, 0.340, 0.161, 0.103, 0.111, 'midInk');
    box(store, 0.881, 0.714, 0.396, 0.101, 0.056, 0.012, 'roseLit');
    box(store, 0.729, 0.661, 0.394, 0.128, 0.058, 0.095, 'orange');
    box(store, 0, 1.43, -0.057, 2.31, 0.108, 1.96, 'teal');
    box(store, 0, 1.502, -0.076, 2.15, 0.058, 1.76, 'midInk');
    box(store, 0, 1.59, 0.786, 2.22, 0.19, 0.16, 'teal');
    box(store, 0, 1.585, 0.884, 2.13, 0.131, 0.045, 'goldLit');
    wordMark(store, 0, 1.585, 0.908, 0.961, 0.138, '海边便利店');
    for (const x of [-0.81, 0.81]) {
      box(store, x, 1.585, 0.913, 0.245, 0.027, 0.022, 'coral');
      box(store, x, 1.546, 0.913, 0.245, 0.021, 0.022, 'teal');
    }
    const canopy = box(store, 0, 1.219, 1.008, 2.27, 0.078, 0.568, 'coral');
    canopy.rotation.x = 0.085;
    for (let i = 0; i < 7; i++) {
      const stripe = box(store, -0.978 + i * 0.326, 1.263, 1.011, 0.149, 0.012, 0.548, 'powder');
      stripe.rotation.x = 0.085;
    }
    box(store, 0, 1.163, 1.285, 2.273, 0.061, 0.067, 'wine');
    box(store, 0, 1.177, 1.331, 2.21, 0.014, 0.013, 'roseLit');
    rooftopAc(store, 0.67, 1.69, -0.50);
    for (const x of [-0.72, -0.51]) {
      cyl(store, x, 1.654, -0.45, 0.075, 0.245, 'mauve');
      cyl(store, x, 1.786, -0.45, 0.103, 0.045, 'midInk');
    }
    const vendor = group(building, 1.143, 0, -0.027);
    box(vendor, 0, 0.48, 0, 0.357, 0.926, 0.281, 'coral');
    box(vendor, 0, 0.708, 0.151, 0.285, 0.321, 0.037, 'goldLit');
    box(vendor, 0, 0.173, 0.157, 0.217, 0.091, 0.037, 'midInk');
    box(vendor, 0.095, 0.405, 0.157, 0.087, 0.086, 0.031, 'teal');
    for (let row = 0; row < 2; row++) box(vendor, 0, 0.606 + row * 0.132, 0.171, 0.288, 0.022, 0.037, 'cream');
    massBoxes(vendor, Array.from({length: 10}, (_, index) => [
      -0.104 + 0.052 * (index % 5), 0.653 + 0.132 * Math.floor(index / 5), 0.181,
      0.033, 0.061, 0.02, [0xf48a91, 0x5faaba, 0x9ec282, 0xfeb663, 0x7d80b7][index % 5],
    ]));
    const bike = group(building, -0.70, 0, 1.21);
    bike.rotation.y = -0.18;
    for (const x of [-0.285, 0.261]) {
      ring(bike, x, 0.146, 0, 0.128, 0.018, 'ink');
      ring(bike, x, 0.146, 0, 0.103, 0.009, 'pale');
      for (const slope of [-0.07, 0, 0.07]) bar(bike, [x - 0.073, 0.146 - slope, 0], [x + 0.073, 0.146 + slope, 0], 0.004, 'pale');
    }
    for (const [start, end] of [
      [[-0.285, 0.146, 0], [-0.096, 0.350, 0]], [[-0.285, 0.146, 0], [-0.012, 0.158, 0]],
      [[-0.012, 0.158, 0], [-0.096, 0.350, 0]], [[-0.096, 0.350, 0], [0.183, 0.329, 0]],
      [[-0.012, 0.158, 0], [0.183, 0.329, 0]], [[0.261, 0.146, 0], [0.167, 0.414, 0]],
    ]) bar(bike, start, end, 0.014, 'mint');
    box(bike, -0.113, 0.365, 0, 0.10, 0.029, 0.046, 'ink');
    bar(bike, [0.167, 0.414, -0.059], [0.167, 0.414, 0.065], 0.014, 'ink');
    const rack = group(building, 0.889, 0, 0.996);
    cyl(rack, 0, 0.035, 0, 0.108, 0.065, 'teal');
    ring(rack, 0, 0.255, 0, 0.101, 0.015, 'teal').rotation.x = Math.PI / 2;
    for (let i = -1; i <= 1; i++) {
      const x = i * 0.054;
      bar(rack, [x, 0.037, 0], [x + i * 0.030, 0.388, 0], 0.013, 'ink');
      const body = cyl(rack, x + i * 0.017, 0.188, 0, 0.031, 0.239, i === 0 ? 'orange' : 'powder');
      body.rotation.z = -i * 0.09;
      ring(rack, x + i * 0.031 + 0.017, 0.392, 0, 0.021, 0.007, 'pale');
    }
    return building;
  }
  function skills() {
    const building = new THREE.Group();
    const shop = group(building, 0, 0, -0.22);
    box(shop, 0, 0.070, 0.043, 2.23, 0.14, 1.99, 'midInk');
    box(shop, 0, 0.151, 0.045, 2.12, 0.028, 1.87, 'floor');
    box(shop, 0, 0.704, -0.756, 2.06, 1.092, 0.132, 'mauve');
    box(shop, -0.965, 0.71, -0.03, 0.125, 1.10, 1.35, 'pink');
    box(shop, 0.973, 0.68, -0.342, 0.125, 1.04, 0.729, 'pink');
    box(shop, 0.968, 0.277, 0.325, 0.126, 0.221, 0.615, 'teal');
    const side = group(shop, 1.032, 0.709, 0.345);
    side.rotation.y = Math.PI / 2;
    frontWindow(side, 0, 0, 0, 0.577, 0.636, {trim: 'teal'});
    box(shop, 0, 1.185, -0.026, 2.07, 0.147, 1.56, 'ink');
    box(shop, -0.03, 1.12, -0.025, 1.83, 0.037, 1.36, 'goldLit');
    box(shop, 0.32, 0.285, 0.677, 1.31, 0.244, 0.112, 'powder');
    frontWindow(shop, 0.304, 0.749, 0.746, 1.277, 0.659, {trim: 'teal'});
    box(shop, -0.671, 0.636, 0.694, 0.62, 0.934, 0.157, 'teal');
    box(shop, -0.672, 0.757, 0.785, 0.486, 0.522, 0.028, 'darkWindow');
    box(shop, -0.832, 0.53, 0.800, 0.046, 0.132, 0.031, 'goldLit');
    for (const x of [-0.928, -0.371, 0.958]) box(shop, x, 0.643, 0.754, 0.060, 1.005, 0.065, 'midInk');
    box(shop, 0.37, 0.521, 0.327, 1.07, 0.092, 0.489, 'cream');
    for (const x of [-0.074, 0.797]) for (const z of [0.129, 0.512]) box(shop, x, 0.332, z, 0.062, 0.34, 0.067, 'teal');
    box(shop, 0.696, 0.627, 0.241, 0.28, 0.121, 0.284, 'coral');
    box(shop, 0.696, 0.786, 0.172, 0.271, 0.258, 0.096, 'ink');
    box(shop, 0.696, 0.798, 0.226, 0.204, 0.144, 0.015, 'roseLit');
    box(shop, -0.01, 0.619, 0.474, 0.182, 0.114, 0.157, 'blue');
    box(shop, -0.01, 0.687, 0.474, 0.102, 0.022, 0.079, 'ink');
    box(shop, 0.236, 0.578, 0.458, 0.236, 0.055, 0.102, 'mint');
    box(shop, 0.257, 0.613, 0.442, 0.136, 0.025, 0.062, 'orange');
    const pegboard = box(shop, 0.213, 0.773, -0.675, 1.17, 0.518, 0.052, 'goldLit');
    pegboard.castShadow = false;
    const pegMarks = [];
    for (let row = 0; row < 4; row++) for (let x = 0; x < 9; x++) {
      pegMarks.push([-0.27 + 0.119 * x, 0.574 + 0.115 * row, -0.640, 0.013, 0.013, 0.013, 0x9b654f]);
    }
    massBoxes(shop, pegMarks);
    for (const x of [-0.146, 0.118, 0.360, 0.533]) {
      box(shop, x, 0.745, -0.622, 0.037, 0.13, 0.028, x > 0.2 ? 'teal' : 'coral');
      box(shop, x, 0.823, -0.619, 0.079, 0.029, 0.031, 'midInk');
    }
    box(shop, 0.42, 1.345, -0.029, 1.27, 0.209, 1.662, 'mauve');
    box(shop, 0.42, 1.475, -0.029, 1.33, 0.064, 1.75, 'coral');
    box(shop, -0.643, 1.356, -0.041, 0.774, 0.324, 1.652, 'teal');
    const skylight = box(shop, -0.662, 1.545, -0.116, 0.876, 0.071, 1.573, 'blue');
    skylight.rotation.z = -0.13;
    for (let z = -0.667; z < 0.63; z += 0.216) {
      const seam = box(shop, -0.662, 1.584, z, 0.87, 0.013, 0.021, 'mint');
      seam.rotation.z = -0.13;
    }
    box(shop, 0.50, 1.299, 0.866, 0.90, 0.132, 0.145, 'teal');
    box(shop, 0.50, 1.295, 0.946, 0.828, 0.084, 0.021, 'goldLit');
    wordMark(shop, 0.50, 1.297, 0.959, 0.805, 0.099, '工坊');
    rooftopAc(shop, -0.602, 1.701, -0.484);
    const dishStand = group(shop, 0.602, 1.507, -0.312);
    cyl(dishStand, 0, 0.042, 0, 0.225, 0.083, 'ink');
    cyl(dishStand, 0, 0.155, 0, 0.100, 0.197, 'teal');
    const dish = group(dishStand, 0.01, 0.283, 0.008);
    dish.rotation.set(0.53, 0, -0.48);
    const shape = [
      [0, -0.037], [0.099, -0.015], [0.210, 0.025], [0.314, 0.089], [0.387, 0.150],
      [0.390, 0.186], [0.309, 0.132], [0.202, 0.068], [0.092, 0.031], [0, 0.019],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const shell = new THREE.Mesh(new THREE.LatheGeometry(shape, 28), materials.cream);
    shell.castShadow = true;
    dish.add(shell);
    ring(dish, 0, 0.170, 0, 0.391, 0.022, 'teal').rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const angle = i * 2 * Math.PI / 3;
      bar(dish, [0.275 * Math.cos(angle), 0.103, 0.275 * Math.sin(angle)], [0, 0.317, 0], 0.016, 'blue');
    }
    ball(dish, 0, 0.319, 0, 0.06, 'coral');
    building.userData.animate = ({elapsed = 0, hovered = false, reduced = false} = {}) => {
      dishStand.rotation.y = !reduced && hovered ? Math.sin(elapsed * 1.1) * 0.24 : 0;
    };
    const ladder = group(building, 1.113, 0, -0.545);
    for (const z of [-0.137, 0.137]) bar(ladder, [0.124, 0.009, z], [0, 1.526, z], 0.025, 'orange');
    for (let i = 0; i < 8; i++) {
      const y = 0.147 + 0.174 * i;
      bar(ladder, [0.124 - y * 0.08, y, -0.137], [0.124 - y * 0.08, y, 0.137], 0.021, 'pale');
    }
    box(building, -0.67, 0.052, 0.835, 0.56, 0.105, 0.301, 'teal');
    box(building, -0.67, 0.113, 0.842, 0.48, 0.028, 0.238, 'mint');
    box(building, 0.74, 0.115, 0.987, 0.406, 0.229, 0.28, 'mauve');
    box(building, 0.74, 0.207, 1.132, 0.323, 0.023, 0.024, 'coral');
    planter(building, -1.013, 0.909);
    return building;
  }
  function contact() {
    const building = new THREE.Group();
    const office = group(building, -0.080, 0, -0.153);
    box(office, 0, 0.065, 0.08, 2.25, 0.130, 1.88, 'midInk');
    box(office, 0, 0.145, 0.067, 2.2, 0.045, 1.823, 'cream');
    box(office, 0, 0.707, -0.015, 1.997, 1.101, 1.528, 'pink');
    box(office, 0, 0.293, 0.004, 2.027, 0.285, 1.547, 'powder');
    box(office, -0.543, 0.739, 0.759, 0.62, 0.641, 0.069, 'cream');
    frontWindow(office, -0.543, 0.756, 0.804, 0.433, 0.456, {window: 'goldLit', trim: 'darkRose'});
    box(office, 0.572, 0.739, 0.759, 0.64, 0.645, 0.069, 'cream');
    frontWindow(office, 0.572, 0.756, 0.804, 0.45, 0.456, {window: 'goldLit', trim: 'darkRose'});
    for (const x of [-0.807, -0.283, 0.3, 0.844]) {
      box(office, x, 0.76, 0.838, 0.10, 0.478, 0.088, 'coral');
      for (let i = 0; i < 5; i++) box(office, x, 0.565 + 0.08 * i, 0.890, 0.078, 0.017, 0.022, 'orange');
    }
    box(office, 0.01, 0.563, 0.786, 0.465, 0.805, 0.132, 'mauve');
    box(office, 0.01, 0.723, 0.86, 0.346, 0.363, 0.028, 'goldLit');
    box(office, 0.01, 0.707, 0.879, 0.344, 0.032, 0.022, 'mauve');
    ball(office, 0.150, 0.505, 0.894, 0.033, 'orange');
    box(office, 0.011, 0.145, 1.0, 0.659, 0.057, 0.266, 'orange');
    box(office, 0.015, 0.197, 0.961, 0.549, 0.058, 0.212, 'pale');
    for (const x of [-0.981, 0.981]) {
      box(office, x, 0.703, 0.750, 0.107, 1.110, 0.133, 'cream');
      box(office, x, 1.276, 0.737, 0.172, 0.107, 0.168, 'powder');
    }
    const side = group(office, 1.011, 0.765, 0.056);
    side.rotation.y = Math.PI / 2;
    frontWindow(side, 0.025, 0, 0, 0.705, 0.498, {window: 'goldLit', trim: 'darkRose'});
    box(side, 0.022, -0.281, 0.027, 0.788, 0.06, 0.112, 'pale');
    box(office, 0, 1.284, 0.021, 2.14, 0.127, 1.68, 'cream');
    for (const sideIndex of [-1, 1]) {
      const slope = box(office, 0.56 * sideIndex, 1.559, -0.024, 1.25, 0.118, 1.747, 'coral');
      slope.rotation.z = -0.329 * sideIndex;
      for (let i = 0; i < 8; i++) {
        const z = -0.775 + i * 0.217;
        bar(office, [0.025 * sideIndex, 1.812, z], [1.136 * sideIndex, 1.432, z], 0.036, i % 3 ? 'darkRose' : 'wine');
      }
    }
    const gable = new THREE.Shape();
    gable.moveTo(-1.041, 1.334);
    gable.lineTo(1.041, 1.334);
    gable.lineTo(0, 1.721);
    gable.closePath();
    const facade = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, {depth: 1.608, bevelEnabled: false}), materials.powder);
    facade.position.z = -0.814;
    facade.castShadow = true;
    office.add(facade);
    bar(office, [0, 1.811, -0.902], [0, 1.811, 0.913], 0.06, 'darkRose');
    box(office, 0, 1.131, 0.807, 1.293, 0.155, 0.145, 'darkRose');
    box(office, 0, 1.131, 0.887, 1.19, 0.102, 0.014, 'goldLit');
    wordMark(office, 0, 1.131, 0.897, 0.835, 0.114, '岛屿邮局');
    const feature = envelope(office, 0, 1.845, 0.790, 1.095, 0.607, 'cream');
    feature.rotation.z = -0.145;
    building.userData.animate = ({elapsed = 0, hovered = false, reduced = false} = {}) => {
      feature.rotation.z = -0.145 + (!reduced && hovered ? Math.sin(elapsed * 2.3) * 0.055 : 0);
    };
    const postbox = group(building, 1.071, 0, 0.778);
    cyl(postbox, 0, 0.056, 0, 0.171, 0.112, 'midInk');
    cyl(postbox, 0, 0.245, 0, 0.10, 0.351, 'darkRose');
    box(postbox, 0, 0.63, 0, 0.39, 0.511, 0.353, 'coral');
    box(postbox, 0, 0.921, 0, 0.426, 0.115, 0.391, 'wine');
    box(postbox, 0, 0.752, 0.180, 0.275, 0.050, 0.021, 'midInk');
    envelope(postbox, 0.01, 0.591, 0.182, 0.18, 0.101, 'cream');
    planter(building, -1.214, 0.775, true);
    const stacked = envelope(building, 0.95, 0.199, -0.871, 0.471, 0.275, 'powder');
    stacked.rotation.y = 1.08;
    stacked.rotation.z = 0.16;
    return building;
  }
  return {skills, life, contact};
}
