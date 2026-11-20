export function makeAcademicModels(THREE) {
  const boxShape = new THREE.BoxGeometry(1, 1, 1);
  const diskShape = new THREE.CylinderGeometry(.5, .5, 1, 16);
  const sphereShape = new THREE.IcosahedronGeometry(.5, 1);
  const wheelShape = new THREE.TorusGeometry(.42, .08, 6, 18);
  const prism = new THREE.Shape();
  prism.moveTo(-.5, 0);
  prism.lineTo(.5, 0);
  prism.lineTo(0, 1);
  prism.closePath();
  const gableShape = new THREE.ExtrudeGeometry(prism, {depth: 1, bevelEnabled: false});
  gableShape.translate(0, 0, -.5);
  const transform = new THREE.Object3D();
  const matte = (color, roughness = .77) => new THREE.MeshStandardMaterial({color, roughness});
  const glow = (color, emissiveIntensity = .46) => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity, roughness: .72
  });
  const paint = {
    coal: matte('#453444'),
    edge: matte('#554054'),
    tile: matte('#aa7787'),
    cream: matte('#f8d9c2'),
    sand: matte('#dcb39c'),
    rose: matte('#cc8c9c'),
    red: matte('#b65f72'),
    copper: matte('#d67569'),
    copperLight: matte('#e29380'),
    mint: matte('#7fab9a'),
    pine: matte('#4d796b'),
    purple: matte('#626482'),
    mauve: matte('#8c789d'),
    tree: matte('#8e6c69'),
    wood: matte('#ac715d'),
    bench: matte('#704c51'),
    paper: matte('#ffe9ca'),
    floor: matte('#d8a88a'),
    amber: glow('#f8c186'),
    interiorWall: glow('#dfac88', .21),
    interiorFloor: glow('#dfb49a', .14),
    interiorPaper: glow('#fae1c5', .20),
    warm: glow('#ffdda3', .82),
    pale: glow('#ffedbf', .62),
    sign: glow('#ffcdbc', .58),
    cyan: glow('#9be6e1', .55),
    glass: new THREE.MeshBasicMaterial({
      color: '#d7e8ef', transparent: true, opacity: .09, depthWrite: false
    })
  };

  function builder(name) {
    const group = new THREE.Group();
    group.name = name;
    const batches = new Map();
    function shape(geometry, material, x, y, z, width, height, depth, rx = 0, ry = 0, rz = 0) {
      const key = geometry.id + ':' + material.id;
      if (!batches.has(key)) batches.set(key, {geometry, material, instances: []});
      transform.position.set(x, y, z);
      transform.rotation.set(rx, ry, rz);
      transform.scale.set(width, height, depth);
      transform.updateMatrix();
      batches.get(key).instances.push(transform.matrix.clone());
    }
    const box = (...args) => shape(boxShape, ...args);
    const disk = (...args) => shape(diskShape, ...args);
    const globe = (...args) => shape(sphereShape, ...args);
    const gable = (...args) => shape(gableShape, ...args);
    const ring = (...args) => shape(wheelShape, ...args);
    const finish = () => {
      for (const {geometry, material, instances} of batches.values()) {
        if (instances.length === 1) {
          const mesh = new THREE.Mesh(geometry, material);
          instances[0].decompose(mesh.position, mesh.quaternion, mesh.scale);
          mesh.castShadow = !material.transparent;
          mesh.receiveShadow = !material.transparent;
          group.add(mesh);
          continue;
        }
        const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
        instances.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        mesh.castShadow = !material.transparent;
        mesh.receiveShadow = !material.transparent;
        group.add(mesh);
      }
      return group;
    };
    return {box, disk, globe, gable, ring, finish};
  }

  function framedWindow(box, x, y, z, width, height, side = false, filled = true) {
    const depth = .037;
    const outward = Math.sign(side ? x : z);
    const put = (material, u, v, w, h, inset = 0) => {
      if (side) {
        box(material, x + outward * inset, y + v, z + u, depth, h, w);
      } else {
        box(material, x + u, y + v, z + outward * inset, w, h, depth);
      }
    };
    if (filled) put(paint.amber, 0, 0, width, height, -.021);
    put(paint.edge, 0, height / 2, width + .052, .055);
    put(paint.edge, 0, -height / 2, width + .052, .055);
    put(paint.edge, -width / 2, 0, .044, height);
    put(paint.edge, width / 2, 0, .044, height);
    put(paint.edge, 0, 0, .029, height, .006);
    put(paint.edge, 0, height * .27, width, .026, .006);
    put(paint.sand, 0, -height / 2 - .033, width + .09, .028, .009);
  }

  function roof({box, gable}, x, y, z, width, rise, depth, base, ridge) {
    gable(base, x, y, z, width, rise, depth);
    const angle = Math.atan2(rise, width / 2);
    const slopeLength = Math.hypot(rise, width / 2);
    for (const sign of [-1, 1]) {
      box(base, x + sign * width / 4, y + rise / 2 + .018, z,
        slopeLength + .08, .063, depth + .075, 0, 0, -sign * angle);
      for (const fraction of [.18, .38, .58, .79]) {
        box(ridge, x + sign * width / 2 * fraction, y + rise * (1 - fraction) + .061, z,
          .032, .035, depth + .085, 0, 0, -sign * angle);
      }
      box(paint.edge, x + sign * (width / 2 + .012), y + .005, z, .052, .049, depth + .09);
    }
    box(ridge, x, y + rise + .057, z, .104, .053, depth + .11);
    for (const sign of [-1, 1]) {
      box(base, x, y + .003, z + sign * (depth / 2 + .015), width + .04, .061, .045);
    }
  }

  function planter({box, globe}, x, z, width = .46, depth = .25) {
    box(paint.red, x, .095, z, width, .19, depth);
    box(paint.copperLight, x, .192, z, width + .04, .035, depth + .04);
    box(paint.coal, x, .216, z, width - .037, .02, depth - .042);
    for (const sign of [-1, 0, 1]) {
      globe(sign === 0 ? paint.pine : paint.mint, x + sign * width * .26,
        sign === 0 ? .329 : .276, z + sign * .014, width * .48, .22, depth * .8);
    }
    for (const sign of [-1, 1]) {
      globe(paint.sign, x + sign * width * .23, .378, z + .027, .079, .065, .075);
    }
  }

  function steps(box, x, z, width) {
    box(paint.tile, x, .045, z + .14, width + .13, .09, .42);
    box(paint.sand, x, .09, z + .065, width + .05, .12, .34);
    box(paint.cream, x, .127, z - .01, width, .125, .28);
  }

  function bookshelf(put, x, z, width, levels, spacing, side = false) {
    const box = (material, bx, y, bz, w, h, d, rx = 0, ry = 0, rz = 0) => {
      if (side) put(material, x + bz - z, y, z - bx + x, w, h, d, rx, Math.PI / 2, rz);
      else put(material, bx, y, bz, w, h, d, rx, ry, rz);
    };
    box(paint.wood, x, .24 + (levels * spacing) / 2, z - .055, width, levels * spacing, .06);
    for (const sign of [-1, 1]) {
      box(paint.bench, x + sign * width / 2, .22 + (levels * spacing) / 2, z, .047, levels * spacing + .04, .2);
    }
    const books = [paint.red, paint.pine, paint.interiorPaper, paint.mauve, paint.copper, paint.sand];
    for (let shelf = 0; shelf < levels; shelf++) {
      const levelY = .254 + shelf * spacing;
      box(paint.bench, x, levelY, z, width, .041, .23);
      for (let i = 0; i < 9; i++) {
        if ((i + 2 * shelf) % 7 === 5) continue;
        const w = (width - .12) / 9;
        const h = Math.min(spacing - .08, .104 + ((i * 7 + shelf * 3) % 5) * .022);
        const bookX = x - width / 2 + .075 + i * w;
        box(books[(i + shelf * 3) % books.length], bookX, levelY + .021 + h / 2, z + .017,
          w * .82, h, .124, 0, 0, i === 6 ? -.17 : 0);
      }
    }
    box(paint.bench, x, .254 + levels * spacing, z, width + .016, .044, .24);
  }

  function academic() {
    const model = builder('学业探索 · 馆藏小屋');
    const {box, disk, gable, ring} = model;
    box(paint.tile, 0, .062, -.18, 2.57, .124, 2.08);
    box(paint.floor, 0, .136, -.18, 2.51, .052, 2.02);
    box(paint.interiorFloor, 0, .166, -.21, 2.28, .012, 1.8);
    box(paint.rose, 0, .935, -1.119, 2.48, 1.55, .112);
    box(paint.red, -1.193, .935, -.238, .102, 1.55, 1.82);
    box(paint.rose, 1.193, .47, -.2, .102, .63, 1.9);
    box(paint.rose, 1.193, 1.6, -.2, .102, .24, 1.9);
    box(paint.rose, 1.193, 1.17, -.88, .102, .68, .55);
    box(paint.rose, 1.193, 1.17, .615, .102, .68, .28);
    framedWindow(box, 1.247, 1.112, -.067, 1.08, .67, true, false);
    box(paint.glass, 1.261, 1.112, -.067, .013, .65, 1.06);
    box(paint.sand, 0, .336, .748, 2.47, .35, .12);
    for (const [x, w] of [[-1.176, .125], [.256, .134], [1.173, .124]]) {
      box(paint.cream, x, .977, .745, w, 1.49, .14);
    }
    box(paint.cream, 0, 1.62, .747, 2.47, .25, .14);
    framedWindow(box, -.465, 1.012, .824, 1.24, .92, false, false);
    box(paint.glass, -.465, 1.012, .851, 1.206, .878, .01);
    box(paint.edge, .707, .778, .821, .694, 1.23, .082);
    box(paint.pale, .707, .866, .869, .553, .876, .021);
    box(paint.wood, .707, .418, .886, .553, .302, .037);
    box(paint.edge, .707, .995, .893, .553, .027, .031);
    box(paint.edge, .707, .765, .894, .021, .736, .029);
    disk(paint.copperLight, .895, .787, .932, .057, .032, .057, Math.PI / 2);
    box(paint.coal, .707, 1.383, .849, .69, .118, .047);
    box(paint.sign, .707, 1.389, .88, .552, .026, .023);
    steps(box, .707, .953, .691);
    box(paint.bench, .706, .201, 1.026, .446, .017, .189);
    box(paint.interiorWall, -1.138, .9, -.223, .028, 1.423, 1.715);
    box(paint.interiorWall, 0, .9, -1.053, 2.26, 1.423, .026);
    bookshelf(box, -.57, -.547, 1.05, 4, .266);
    bookshelf(box, .67, -.681, .66, 3, .256);
    bookshelf(box, -1.016, .293, .727, 3, .255, true);
    box(paint.amber, .02, 1.611, -.126, 2.28, .09, 1.73);
    box(paint.warm, -.54, 1.555, .27, .637, .025, .124);
    box(paint.warm, .55, 1.555, .27, .55, .025, .124);
    box(paint.wood, -.454, .568, .298, .71, .065, .41);
    for (const x of [-.769, -.138]) {
      box(paint.bench, x, .363, .329, .044, .36, .271);
    }
    box(paint.interiorPaper, -.489, .61, .372, .36, .027, .23, 0, -.17);
    box(paint.red, -.397, .644, .319, .22, .028, .15, 0, .19);
    box(paint.edge, 0, 1.736, -.194, 2.67, .087, 2.09);
    roof(model, 0, 1.78, -.192, 2.59, .598, 2.058, paint.copper, paint.copperLight);
    box(paint.cream, 0, 1.982, .86, .76, .261, .052);
    box(paint.bench, 0, 1.985, .896, .674, .206, .025);
    box(paint.paper, -.128, 1.986, .921, .229, .108, .027, 0, 0, -.17);
    box(paint.paper, .128, 1.986, .921, .229, .108, .027, 0, 0, .17);
    box(paint.pale, 0, 1.985, .944, .017, .118, .014);
    box(paint.edge, -.752, 2.016, -.753, .185, .397, .25);
    box(paint.copperLight, -.752, 2.236, -.753, .23, .055, .294);
    box(paint.coal, -.752, 2.267, -.753, .14, .018, .185);
    for (const x of [-.9, -.54, -.18, .18, .54, .9]) {
      box(paint.copperLight, x, 1.64, -1.184, .036, .104, .042);
    }
    for (const z of [-.685, .067]) {
      framedWindow(box, -1.248, 1.009, z, .51, .64, true);
    }
    framedWindow(box, -.527, .995, -1.178, .744, .61);
    framedWindow(box, .527, .995, -1.178, .744, .61);
    planter(model, -.881, 1.237, .49, .289);
    box(paint.edge, -.282, .33, 1.23, .335, .042, .23);
    box(paint.red, -.282, .385, 1.23, .379, .07, .259);
    box(paint.red, -.407, .2, 1.23, .052, .239, .123);
    box(paint.red, -.156, .2, 1.23, .052, .239, .123);
    ring(paint.coal, -.43, .113, 1.375, .22, .22, .10);
    ring(paint.coal, -.136, .113, 1.375, .22, .22, .10);
    disk(paint.sand, -.43, .113, 1.379, .12, .022, .12, Math.PI / 2);
    disk(paint.sand, -.136, .113, 1.379, .12, .022, .12, Math.PI / 2);
    return model.finish();
  }

  function internships() {
    const model = builder('实习经历 · 街角媒体工作室');
    const {box, disk, globe} = model;
    box(paint.edge, 0, .066, -.17, 2.698, .132, 2.28);
    box(paint.floor, 0, .143, -.17, 2.627, .047, 2.22);
    box(paint.interiorFloor, 0, .171, -.193, 2.466, .018, 2.08);
    box(paint.tile, 0, .882, -1.23, 2.55, 1.546, .12);
    box(paint.red, -1.263, .881, -.178, .123, 1.552, 2.074);
    box(paint.interiorWall, 0, .874, -1.155, 2.404, 1.413, .035);
    box(paint.interiorWall, -1.185, .874, -.172, .035, 1.413, 2.002);
    box(paint.wood, -1.161, .87, -.332, .028, .921, .838);
    for (const z of [-.693, -.58, -.467, -.354, -.24, -.127, -.014]) {
      box(paint.sand, -1.14, .87, z, .022, .857, .03);
    }
    for (const y of [.229, .302, 1.54]) {
      box(paint.red, 1.213, y, -.204, .148, .08, 2.074);
    }
    for (const z of [-1.096, -.208, .771]) {
      box(paint.red, 1.21, .894, z, .157, 1.485, .105);
    }
    box(paint.red, 0, .27, .837, 2.61, .16, .136);
    box(paint.red, 0, 1.547, .837, 2.61, .105, .136);
    for (const x of [-1.219, -.58, .57, 1.21]) {
      box(paint.edge, x, .942, .841, .061, 1.372, .13);
    }
    framedWindow(box, -.006, .941, .917, 1.15, 1.11, false, false);
    framedWindow(box, -.914, .934, .917, .56, 1.09, false, false);
    framedWindow(box, 1.30, .934, .279, .912, 1.09, true, false);
    framedWindow(box, 1.30, .934, -.654, .812, 1.09, true, false);
    box(paint.glass, -.299, .939, .944, 1.783, 1.065, .011);
    box(paint.glass, 1.322, .939, -.205, .011, 1.063, 1.794);
    box(paint.edge, .897, .859, .917, .56, 1.314, .058);
    box(paint.amber, .897, .914, .956, .469, 1.125, .033);
    box(paint.red, .897, .35, .983, .466, .235, .048);
    box(paint.coal, .897, .845, .983, .016, .79, .02);
    box(paint.edge, .897, 1.14, .983, .47, .03, .022);
    box(paint.warm, .962, .75, 1.003, .03, .132, .02);
    steps(box, .90, 1.021, .578);
    box(paint.pale, -.386, 1.568, .161, 1.17, .035, .09);
    box(paint.pale, .187, 1.567, -.584, 1.19, .036, .095);
    box(paint.amber, -.368, 1.162, -1.151, 1.56, .54, .027);
    box(paint.coal, -.36, 1.14, -1.112, 1.33, .421, .082);
    box(paint.cyan, -.36, 1.14, -1.066, 1.22, .331, .018);
    for (const [x, h] of [[-.814, .073], [-.66, .13], [-.53, .099], [-.408, .17]]) {
      box(paint.edge, x, 1.018 + h / 2, -1.051, .064, h, .018);
    }
    for (const [x, z] of [[-.999, -.68], [.65, -.667]]) {
      box(paint.bench, x, .354, z, .326, .414, .45);
      box(paint.sand, x, .58, z, .371, .054, .499);
      box(paint.coal, x, .714, z - .107, .235, .122, .06, -.16);
      box(paint.cyan, x, .716, z - .072, .186, .074, .014, -.16);
    }
    box(paint.bench, -.293, .437, -.153, 1.113, .515, .32);
    box(paint.sign, -.292, .517, .016, .977, .153, .025);
    box(paint.copperLight, -.293, .713, -.139, 1.192, .076, .42);
    box(paint.interiorPaper, -.293, .766, -.14, 1.192, .032, .42);
    box(paint.coal, -.465, .797, -.183, .38, .021, .174, 0, -.05);
    box(paint.pale, -.479, .82, -.193, .253, .023, .12, 0, -.18);
    box(paint.edge, .117, .86, -.197, .038, .16, .039);
    globe(paint.coal, .117, .971, -.196, .089, .102, .088);
    disk(paint.red, -.141, .411, -.491, .261, .064, .254);
    disk(paint.coal, -.141, .27, -.491, .066, .225, .066);
    box(paint.red, -.141, .588, -.508, .247, .259, .065);
    const camX = -.051;
    const camZ = .491;
    for (const [yaw, offX, offZ] of [[0, 0, .096], [2.08, .078, -.048], [4.16, -.078, -.048]]) {
      box(paint.coal, camX + offX, .424, camZ + offZ, .032, .471, .037, .38, yaw);
    }
    box(paint.coal, camX, .728, camZ, .252, .198, .234, 0, .2);
    disk(paint.coal, camX - .042, .748, camZ - .164, .114, .13, .114, Math.PI / 2);
    disk(paint.cyan, camX - .042, .746, camZ - .236, .081, .018, .081, Math.PI / 2);
    box(paint.sign, camX, .826, camZ + .123, .104, .038, .021);
    box(paint.coal, camX, .857, camZ, .059, .047, .168);
    box(paint.red, 0, 1.644, -.193, 2.72, .133, 2.291);
    box(paint.coal, 0, 1.724, -.193, 2.78, .091, 2.359);
    box(paint.tile, 0, 1.795, -.193, 2.62, .061, 2.195);
    box(paint.cyan, 0, 1.666, .982, 2.663, .029, .029);
    box(paint.cyan, 1.386, 1.666, -.196, .03, .029, 2.325);
    box(paint.red, -.171, 1.932, .79, 1.407, .25, .115);
    box(paint.coal, -.171, 1.99, .86, .911, .32, .098);
    box(paint.sign, -.169, 1.995, .917, .82, .239, .018);
    box(paint.coal, -.167, 2.059, .935, .409, .05, .015, 0, 0, .08);
    box(paint.coal, -.162, 1.978, .938, .373, .11, .017);
    for (const dx of [-.276, -.177, -.078]) {
      box(paint.pale, dx, 2.063, .948, .028, .045, .012, 0, 0, .46);
    }
    box(paint.copper, -.169, 1.984, .951, .252, .019, .012);
    box(paint.edge, .637, 1.923, -.62, .722, .197, .462);
    box(paint.sand, .637, 2.026, -.62, .713, .037, .455);
    disk(paint.coal, .667, 2.05, -.624, .301, .017, .301);
    for (const yaw of [0, Math.PI / 3, 2 * Math.PI / 3]) {
      box(paint.cream, .667, 2.067, -.624, .245, .017, .031, 0, yaw);
    }
    disk(paint.edge, -.857, 1.918, -.578, .181, .21, .181);
    disk(paint.copperLight, -.857, 2.296, -.578, .047, .727, .047);
    box(paint.rose, -.857, 2.529, -.578, .499, .043, .045, 0, -.31);
    box(paint.edge, -.857, 2.372, -.578, .33, .031, .051, 0, -.31);
    globe(paint.sign, -.857, 2.665, -.578, .099, .099, .099);
    box(paint.edge, -1.268, .325, .367, .149, .359, .527);
    box(paint.sand, -1.316, .514, .367, .21, .034, .573);
    for (let i = 0; i < 5; i++) {
      box(paint.coal, -1.35, .399 - i * .043, .367, .028, .012, .418);
    }
    box(paint.amber, -.36, 1.078, -1.291, 1.247, .598, .02);
    framedWindow(box, -.36, 1.071, -1.31, 1.28, .617, false, true);
    box(paint.coal, .701, .816, -1.306, .48, 1.17, .073);
    box(paint.mauve, .701, .814, -1.35, .38, 1.07, .025);
    box(paint.pale, .819, .766, -1.37, .033, .098, .018);
    planter(model, -.925, 1.229, .52, .31);
    return model.finish();
  }

  function education() {
    const model = builder('教育经历 · 校园钟楼');
    const {box, disk, globe, gable} = model;
    box(paint.tile, 0, .073, -.248, 2.96, .146, 1.97);
    box(paint.sand, 0, .155, -.248, 2.87, .071, 1.92);
    box(paint.rose, 0, .786, -.281, 2.721, 1.27, 1.651);
    box(paint.cream, 0, .853, -.273, 2.756, .072, 1.699);
    box(paint.sand, 0, 1.415, -.269, 2.823, .14, 1.754);
    box(paint.edge, 0, 1.5, -.273, 2.922, .069, 1.843);
    for (const x of [-1.322, -.478, .478, 1.322]) {
      box(paint.cream, x, .831, .565, .079, 1.155, .07);
      box(paint.sand, x, .268, .588, .124, .108, .102);
      box(paint.sand, x, 1.366, .585, .124, .095, .091);
    }
    for (const x of [-1.076, -.714, .714, 1.076]) {
      framedWindow(box, x, 1.135, .601, .235, .352);
      framedWindow(box, x, .548, .601, .23, .353);
      box(paint.cream, x, .755, .619, .304, .032, .03);
    }
    for (const side of [-1, 1]) {
      for (const z of [-.726, -.269, .19]) {
        framedWindow(box, side * 1.389, 1.108, z, .25, .374, true);
        framedWindow(box, side * 1.389, .535, z, .24, .355, true);
      }
      for (const x of [.701, 1.077]) {
        framedWindow(box, side * x, 1.109, -1.133, .262, .356);
        framedWindow(box, side * x, .545, -1.133, .247, .35);
      }
    }
    roof(model, -.99, 1.525, -.286, .973, .312, 1.906, paint.purple, paint.mauve);
    roof(model, .99, 1.525, -.286, .973, .312, 1.906, paint.purple, paint.mauve);
    box(paint.red, .006, 1.331, -.151, 1.056, 2.289, 1.438);
    box(paint.sand, .006, 2.188, -.151, 1.095, .095, 1.46);
    box(paint.cream, .006, 2.475, -.149, 1.117, .169, 1.508);
    box(paint.edge, .006, 2.561, -.149, 1.236, .057, 1.605);
    roof(model, .006, 2.589, -.149, 1.246, .383, 1.608, paint.purple, paint.mauve);
    disk(paint.coal, .006, 2.988, -.172, .064, .111, .064);
    globe(paint.copperLight, .006, 3.049, -.172, .098, .098, .098);
    for (const x of [-.514, .526]) {
      box(paint.sand, x, 1.522, .583, .083, 1.799, .096);
    }
    for (const y of [1.306, 1.426, 1.791, 2.176]) {
      box(paint.cream, .006, y, .589, 1.126, .061, .073);
    }
    framedWindow(box, .006, 1.613, .616, .448, .244);
    for (const x of [-.554, .568]) {
      framedWindow(box, x, 1.988, -.21, .299, .39, true);
    }
    const clockY = 1.993;
    disk(paint.edge, .006, clockY, .634, .399, .074, .399, Math.PI / 2);
    disk(paint.cream, .006, clockY, .682, .344, .035, .344, Math.PI / 2);
    disk(paint.pale, .006, clockY, .71, .284, .014, .284, Math.PI / 2);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      box(paint.coal, .006 + Math.sin(a) * .117, clockY + Math.cos(a) * .117, .725,
        i % 3 === 0 ? .015 : .008, i % 3 === 0 ? .033 : .018, .011, 0, 0, -a);
    }
    box(paint.coal, .036, clockY + .035, .729, .017, .105, .014, 0, 0, -.73);
    box(paint.coal, -.035, clockY + .006, .731, .106, .017, .017, 0, 0, -.17);
    disk(paint.red, .006, clockY, .746, .041, .009, .041, Math.PI / 2);
    box(paint.edge, .006, .634, .632, .74, .972, .106);
    gable(paint.edge, .006, 1.12, .637, .74, .201, .105);
    box(paint.warm, .006, .639, .695, .595, .863, .036);
    gable(paint.warm, .006, 1.06, .698, .594, .164, .038);
    box(paint.wood, .006, .372, .728, .588, .332, .047);
    box(paint.edge, .006, .63, .757, .038, .832, .026);
    box(paint.edge, .006, .931, .749, .598, .039, .029);
    steps(box, .006, .909, .798);
    box(paint.bench, .006, .202, 1.001, .474, .021, .236);
    planter(model, -.922, .994, .49, .306);
    planter(model, .922, .994, .49, .306);
    for (const x of [-.863, .862]) {
      box(paint.edge, x, .209, -1.245, .413, .047, .245);
      box(paint.wood, x, .24, -1.245, .431, .045, .233);
      for (const off of [-.148, .148]) {
        box(paint.bench, x + off, .085, -1.244, .036, .17, .166);
      }
    }
    return model.finish();
  }

  return {academic, internships, education};
}
