/**
 * A double-sided paper surface, unfolding from a crumpled volume.
 * No network requests or dependencies. The caller owns its containing overlay.
 *
 * const intro = runPaperIntro(canvas, { onComplete: () => overlay.remove() });
 * skipButton.onclick = intro.skip;
 */
export function runPaperIntro(canvas, { onComplete = () => {}, onUnfold = () => {} } = {}) {
  const DURATION = 2780;
  let gl = null;
  let frame = 0;
  let fallbackTimer = 0;
  let ended = false;
  let destroyed = false;
  let released = false;
  let unfolded = false;
  const programs = [];
  const shaders = [];
  const buffers = [];
  let width = 1;
  let height = 1;

  const release = () => {
    if (released) return;
    released = true;
    cancelAnimationFrame(frame);
    clearTimeout(fallbackTimer);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('webglcontextlost', contextLost);
    if (gl && !gl.isContextLost()) {
      gl.useProgram(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      buffers.forEach(buffer => gl.deleteBuffer(buffer));
      programs.forEach(program => gl.deleteProgram(program));
      shaders.forEach(shader => gl.deleteShader(shader));
    }
  };

  const finish = () => {
    if (ended || destroyed) return;
    ended = true;
    canvas.style.opacity = '0';
    canvas.style.pointerEvents = 'none';
    release();
    onComplete();
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    release();
  };

  function contextLost(event) {
    event.preventDefault();
    finish();
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width || window.innerWidth);
    height = Math.max(1, box.height || window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    const nextWidth = Math.round(width * dpr);
    const nextHeight = Math.round(height * dpr);
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }

  const handle = { skip: finish, destroy };
  canvas.style.opacity = '1';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fallbackTimer = window.setTimeout(finish, 0);
    return handle;
  }

  try {
    gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL unavailable');

    // Derivatives give each triangle a true geometric normal. The fallback
    // computes a surface normal in the vertex shader on older WebGL devices.
    const derivatives = !!gl.getExtension('OES_standard_derivatives');

    function compile(type, source) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'Paper shader failed');
      }
      return shader;
    }

    function program(vertex, fragment) {
      const result = gl.createProgram();
      programs.push(result);
      gl.attachShader(result, compile(gl.VERTEX_SHADER, vertex));
      gl.attachShader(result, compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(result);
      if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(result) || 'Paper program failed');
      }
      return result;
    }

    const paperVertex = `
      precision highp float;
      attribute vec2 aUv;
      uniform float uOpen;
      uniform float uTime;
      uniform float uAspect;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vCrease;

      float creases(vec2 uv) {
        // Intersecting fold families give a broken, non-periodic paper surface.
        float a = abs(sin(uv.x * 9.4 + uv.y * 5.1 + 0.7));
        float b = abs(sin(uv.y * 12.7 - uv.x * 3.8));
        float c = abs(sin(uv.x * 20.2 + uv.y * 15.8 + 1.3));
        return (a - .5) * .19 + (b - .5) * .14 + (c - .5) * .047;
      }

      vec3 surface(vec2 uv) {
        float theta = uv.x * 3.10 + .14 * sin(uv.y * 5.0);
        float phi = uv.y * 1.47 + .055 * sin(uv.x * 8.0);
        float fold = creases(uv);
        float radius = min(.88, uAspect * 1.28);
        radius *= 1.0 + fold * 1.55
          + .055 * sin(uv.x * 19.0 - uv.y * 11.0);
        vec3 ball = radius * vec3(
          sin(theta) * cos(phi),
          sin(phi),
          cos(theta) * cos(phi)
        );

        // Edges lag the middle very slightly: the paper opens rather than
        // merely scaling up. All vertices still arrive at an exactly flat sheet.
        float edge = length(uv * vec2(.82, 1.0)) / 1.3;
        float opening = clamp(uOpen + sin(uOpen * 3.14159265)
          * (.075 - edge * .11), 0.0, 1.0);
        float remaining = 1.0 - opening;
        float planarFold = fold * (1.0 - smoothstep(.65, 1.0, opening));
        vec3 sheet = vec3(
          uv.x * uAspect * 2.57,
          uv.y * 2.57,
          planarFold * 1.5
        );
        // Broad bends unwind first, then finer creases relax.
        sheet.z += sin(uv.x * 3.0 + uv.y * .8)
          * sin(opening * 3.14159265) * .35;
        vec3 p = mix(ball, sheet, opening);
        float az = remaining * (-.26 + .055 * sin(uTime * 1.25));
        float ay = remaining * (-.44 + uTime * .12);
        float ax = remaining * .24;
        p.xy = mat2(cos(az), -sin(az), sin(az), cos(az)) * p.xy;
        p.xz = mat2(cos(ay), -sin(ay), sin(ay), cos(ay)) * p.xz;
        p.yz = mat2(cos(ax), -sin(ax), sin(ax), cos(ax)) * p.yz;
        p.y += remaining * (.065 + sin(uTime * 1.8) * .035);
        return p;
      }

      void main() {
        vec3 p = surface(aUv);
        vec3 dx = surface(aUv + vec2(.002, 0.0)) - p;
        vec3 dy = surface(aUv + vec2(0.0, .002)) - p;
        vNormal = normalize(cross(dx, dy));
        vWorld = p;
        vUv = aUv;
        vCrease = creases(aUv);
        float depth = 5.8 - p.z;
        gl_Position = vec4(
          p.x * 2.41421356 / uAspect,
          p.y * 2.41421356,
          depth * 1.00668896 - .2006689,
          depth
        );
      }
    `;

    const paperFragment = `
      ${derivatives ? '#extension GL_OES_standard_derivatives : enable' : ''}
      precision highp float;
      uniform float uOpen;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vCrease;

      float grain(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec3 n = ${derivatives
          ? 'normalize(cross(dFdx(vWorld), dFdy(vWorld)))'
          : 'normalize(vNormal)'};
        if (n.z < 0.0) n = -n;
        vec3 light = normalize(vec3(-.58, .78, 1.1));
        float diffuse = max(dot(n, light), 0.0);
        float rim = pow(1.0 - max(n.z, 0.0), 3.0);
        float lighting = .54 + diffuse * .50 + rim * .035;
        // Warm-white face, a whisper of rose on the reverse.
        vec3 paper = gl_FrontFacing
          ? vec3(1.0, .973, .942)
          : vec3(.982, .923, .930);
        float crumple = 1.0 - smoothstep(.65, 1.0, uOpen);
        float creaseOcclusion = max(-vCrease, 0.0) * crumple * .35;
        vec3 color = paper * lighting - creaseOcclusion;
        color += (grain(gl_FragCoord.xy) - .5) * .013;
        // The final flat sheet is evenly lit and warm, ready to reveal the page.
        color = mix(color, vec3(1.0, .97254902, .95294118), smoothstep(.90, 1.0, uOpen));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const backdropProgram = program(`
      attribute vec2 aPosition;
      varying vec2 vPosition;
      void main() {
        vPosition = aPosition;
        gl_Position = vec4(aPosition, .9999, 1.0);
      }
    `, `
      precision mediump float;
      varying vec2 vPosition;
      uniform float uAspect;
      uniform float uOpen;
      void main() {
        vec2 p = vPosition * vec2(uAspect, 1.0);
        vec3 pink = vec3(.96078, .85882, .90196);
        float glow = exp(-dot(p * vec2(.7, .55), p * vec2(.7, .55)) * 1.0);
        pink += glow * vec3(.025, .020, .016);
        vec2 shadowUV = (p - vec2(.02, -.43)) / vec2(.36 + uOpen * .65, .055);
        float shadow = exp(-dot(shadowUV, shadowUV) * 1.25)
          * .15 * (1.0 - smoothstep(.0, .6, uOpen));
        gl_FragColor = vec4(pink - vec3(.42, .28, .35) * shadow, 1.0);
      }
    `);
    const paperProgram = program(paperVertex, paperFragment);

    const backdropBuffer = gl.createBuffer();
    buffers.push(backdropBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, backdropBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    // Jittered, alternating triangles avoid a conspicuous regular square grid.
    const columns = 76;
    const rows = 60;
    const vertices = [];
    const grid = [];
    const random = (x, y) => {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= columns; x++) {
        const jx = x === 0 || x === columns ? 0 : (random(x, y) - .5) * .55;
        const jy = y === 0 || y === rows ? 0 : (random(y + 11, x + 19) - .5) * .55;
        grid.push([(x + jx) / columns * 2 - 1, (y + jy) / rows * 2 - 1]);
      }
    }
    const triangle = (a, b, c) => vertices.push(...grid[a], ...grid[b], ...grid[c]);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const a = y * (columns + 1) + x;
        const b = a + 1;
        const c = a + columns + 1;
        const d = c + 1;
        if ((x + y) % 2) {
          triangle(a, b, c);
          triangle(b, d, c);
        } else {
          triangle(a, b, d);
          triangle(a, d, c);
        }
      }
    }
    const paperBuffer = gl.createBuffer();
    buffers.push(paperBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, paperBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const backdrop = {
      position: gl.getAttribLocation(backdropProgram, 'aPosition'),
      aspect: gl.getUniformLocation(backdropProgram, 'uAspect'),
      open: gl.getUniformLocation(backdropProgram, 'uOpen'),
    };
    const paper = {
      uv: gl.getAttribLocation(paperProgram, 'aUv'),
      aspect: gl.getUniformLocation(paperProgram, 'uAspect'),
      open: gl.getUniformLocation(paperProgram, 'uOpen'),
      time: gl.getUniformLocation(paperProgram, 'uTime'),
    };

    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('webglcontextlost', contextLost);
    resize();
    gl.disable(gl.CULL_FACE);
    gl.clearColor(.96078, .85882, .90196, 1);
    const started = performance.now();
    const smootherstep = value => {
      const t = Math.max(0, Math.min(1, value));
      return t * t * t * (t * (t * 6 - 15) + 10);
    };

    function draw(now) {
      if (ended || destroyed) return;
      const elapsed = now - started;
      const open = smootherstep((elapsed - 200) / 2000);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(backdropProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, backdropBuffer);
      gl.enableVertexAttribArray(backdrop.position);
      gl.vertexAttribPointer(backdrop.position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(backdrop.aspect, width / height);
      gl.uniform1f(backdrop.open, open);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.useProgram(paperProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, paperBuffer);
      gl.enableVertexAttribArray(paper.uv);
      gl.vertexAttribPointer(paper.uv, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(paper.aspect, width / height);
      gl.uniform1f(paper.open, open);
      gl.uniform1f(paper.time, elapsed / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);

      // A seamless dissolve only after the paper has filled the viewport.
      if (!unfolded && elapsed >= 2200) {
        unfolded = true;
        onUnfold();
        if (ended || destroyed) return;
      }
      const fade = smootherstep((elapsed - 2360) / (DURATION - 2360));
      canvas.style.opacity = String(1 - fade);
      if (elapsed >= DURATION) finish();
      else frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
  } catch (error) {
    // Content remains usable if WebGL is disabled or a shader is unsupported.
    fallbackTimer = window.setTimeout(finish, 0);
  }

  return handle;
}
