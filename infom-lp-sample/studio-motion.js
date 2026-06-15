(function () {
  const hero = document.querySelector("[data-studio-hero]");
  const canvas = document.querySelector("[data-studio-webgl]");
  if (!hero || !canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, powerPreference: "high-performance" });
  if (!gl) {
    hero.classList.add("hero-no-webgl");
    return;
  }

  const VERT = `
    attribute vec3 aShapeA;
    attribute vec3 aShapeB;
    attribute vec3 aShapeC;
    attribute vec4 aSeed;
    uniform mat4 uProj;
    uniform vec3 uWeights;
    uniform float uTime;
    uniform float uScatter;
    uniform vec2 uRot;
    uniform vec2 uMouse;
    uniform float uMouseForce;
    uniform vec2 uShift;
    uniform float uCamZ;
    uniform float uPointScale;
    varying float vSeed;
    varying float vDepth;
    varying float vPush;

    void main() {
      vec3 pos = aShapeA * uWeights.x + aShapeB * uWeights.y + aShapeC * uWeights.z;
      pos.y += uWeights.z * 0.14 * sin(aShapeC.x * 3.2 + uTime * 1.5);
      pos += aSeed.xyz * uScatter * (0.36 + aSeed.w);
      pos *= 1.0 + 0.035 * sin(uTime * 0.72 + aSeed.w * 6.2831);

      float cy = cos(uRot.x);
      float sy = sin(uRot.x);
      pos = vec3(pos.x * cy + pos.z * sy, pos.y, -pos.x * sy + pos.z * cy);
      float cx = cos(uRot.y);
      float sx = sin(uRot.y);
      pos = vec3(pos.x, pos.y * cx - pos.z * sx, pos.y * sx + pos.z * cx);

      vec4 view = vec4(pos.x, pos.y, pos.z - uCamZ, 1.0);
      vec4 clip = uProj * view;
      vec2 ndc = clip.xy / clip.w + uShift;
      vec2 toMouse = ndc - uMouse;
      float dist = length(toMouse);
      float push = smoothstep(0.42, 0.0, dist) * uMouseForce;
      ndc += (toMouse / max(dist, 0.001)) * push * 0.17;
      clip = vec4(ndc * clip.w, clip.z, clip.w);

      gl_Position = clip;
      vSeed = aSeed.w;
      vDepth = clamp((view.z + uCamZ + 1.6) / 3.2, 0.0, 1.0);
      vPush = push;
      gl_PointSize = uPointScale * (0.5 + aSeed.w) * (1.0 + push * 2.4) / clip.w;
    }
  `;

  const FRAG = `
    precision highp float;
    uniform float uTime;
    varying float vSeed;
    varying float vDepth;
    varying float vPush;

    void main() {
      float d = length(gl_PointCoord - 0.5);
      float alpha = smoothstep(0.5, 0.04, d);
      float twinkle = 0.7 + 0.3 * sin(uTime * (1.2 + vSeed * 2.4) + vSeed * 43.0);
      vec3 teal = vec3(0.48, 0.86, 0.84);
      vec3 violet = vec3(0.56, 0.45, 1.0);
      vec3 pink = vec3(1.0, 0.42, 0.78);
      vec3 white = vec3(0.94, 0.98, 1.0);
      vec3 color = mix(teal, violet, smoothstep(0.15, 0.72, vSeed));
      color = mix(color, pink, smoothstep(0.72, 1.0, vSeed) * 0.52);
      color = mix(color, white, step(0.965, vSeed));
      color = mix(color, white, vPush * 0.7);
      alpha *= twinkle * mix(0.35, 1.0, vDepth);
      gl_FragColor = vec4(color * alpha, alpha);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    hero.classList.add("hero-no-webgl");
    return;
  }
  gl.useProgram(program);

  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  const COUNT = isMobile ? 8000 : 15000;
  const shapeA = new Float32Array(COUNT * 3);
  const shapeB = new Float32Array(COUNT * 3);
  const shapeC = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT * 4);
  const gridW = Math.ceil(Math.sqrt(COUNT * 1.5));
  const gridH = Math.ceil(COUNT / gridW);

  for (let i = 0; i < COUNT; i += 1) {
    const t = Math.random() * Math.PI * 2;
    const knotR = 2 + Math.cos(3 * t);
    const tube = 0.16 * Math.cbrt(Math.random());
    const tubeAngle = Math.random() * Math.PI * 2;
    shapeA[i * 3] = knotR * Math.cos(2 * t) * 0.42 + Math.cos(tubeAngle) * tube;
    shapeA[i * 3 + 1] = knotR * Math.sin(2 * t) * 0.42 + Math.sin(tubeAngle) * tube;
    shapeA[i * 3 + 2] = Math.sin(3 * t) * 0.5 + (Math.random() - 0.5) * 0.12;

    const k = i + 0.5;
    const phi = Math.acos(1 - (2 * k) / COUNT);
    const theta = Math.PI * (1 + Math.sqrt(5)) * k;
    const radius = 1.1 + (Math.random() - 0.5) * 0.08;
    shapeB[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    shapeB[i * 3 + 1] = radius * Math.cos(phi);
    shapeB[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const col = i % gridW;
    const row = Math.floor(i / gridW);
    const gx = ((col / (gridW - 1)) * 2 - 1) * 1.85;
    const gz = ((row / Math.max(gridH - 1, 1)) * 2 - 1) * 1.18;
    shapeC[i * 3] = gx;
    shapeC[i * 3 + 1] = 0.18 * Math.sin(gx * 2.8) + 0.14 * Math.cos(gz * 3.1);
    shapeC[i * 3 + 2] = gz;

    const sx = Math.random() * 2 - 1;
    const sy = Math.random() * 2 - 1;
    const sz = Math.random() * 2 - 1;
    const len = Math.max(Math.hypot(sx, sy, sz), 0.001);
    seeds[i * 4] = sx / len;
    seeds[i * 4 + 1] = sy / len;
    seeds[i * 4 + 2] = sz / len;
    seeds[i * 4 + 3] = Math.random();
  }

  function bindAttribute(name, data, size) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }

  bindAttribute("aShapeA", shapeA, 3);
  bindAttribute("aShapeB", shapeB, 3);
  bindAttribute("aShapeC", shapeC, 3);
  bindAttribute("aSeed", seeds, 4);

  const uniforms = {};
  ["uProj", "uWeights", "uTime", "uScatter", "uRot", "uMouse", "uMouseForce", "uShift", "uCamZ", "uPointScale"].forEach((name) => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const proj = new Float32Array(16);
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const aspect = canvas.width / Math.max(canvas.height, 1);
    const f = 1 / Math.tan((50 * Math.PI) / 360);
    const near = 0.1;
    const far = 12;
    proj.fill(0);
    proj[0] = f / aspect;
    proj[5] = f;
    proj[10] = -(far + near) / (far - near);
    proj[11] = -1;
    proj[14] = -(2 * far * near) / (far - near);
    gl.uniformMatrix4fv(uniforms.uProj, false, proj);
    gl.uniform1f(uniforms.uPointScale, canvas.height * 0.011);
    gl.uniform1f(uniforms.uCamZ, width < 880 ? 3.9 : 2.95);
    gl.uniform2f(uniforms.uShift, width < 880 ? 0 : 0.36, 0);
  }

  const ease = (x) => x * x * (3 - 2 * x);
  const HOLD = 4.0;
  const MORPH = 1.5;
  const CYCLE = HOLD + MORPH;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, force: 0, targetForce: 0 };
  let drag = 0;
  let dragVel = 0;
  let dragging = false;
  let dragLastX = 0;
  let scrollFactor = 0;
  let rafId = 0;
  let visible = true;
  const startTime = performance.now();

  function frame(now) {
    rafId = 0;
    if (!visible) return;
    const time = (now - startTime) * 0.001;
    const cycleT = (time / CYCLE) % 3;
    const index = Math.floor(cycleT);
    const frac = cycleT - index;
    const holdPortion = HOLD / CYCLE;
    const morph = frac < holdPortion ? 0 : ease((frac - holdPortion) / (1 - holdPortion));
    const weights = [0, 0, 0];
    weights[index] = 1 - morph;
    weights[(index + 1) % 3] = morph;

    mouse.x += (mouse.tx - mouse.x) * 0.07;
    mouse.y += (mouse.ty - mouse.y) * 0.07;
    mouse.force += (mouse.targetForce - mouse.force) * 0.06;
    if (!dragging) {
      drag += dragVel;
      dragVel *= 0.95;
    }

    const burst = Math.sin(morph * Math.PI) * 0.55;
    gl.uniform3f(uniforms.uWeights, weights[0], weights[1], weights[2]);
    gl.uniform1f(uniforms.uTime, time);
    gl.uniform1f(uniforms.uScatter, burst + scrollFactor * 1.55);
    gl.uniform2f(uniforms.uRot, time * 0.13 + drag + mouse.x * 0.24, -0.16 + mouse.y * 0.2 + scrollFactor * 0.55);
    gl.uniform2f(uniforms.uMouse, mouse.x, mouse.y);
    gl.uniform1f(uniforms.uMouseForce, mouse.force);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    rafId = requestAnimationFrame(frame);
  }

  function schedule() {
    if (!rafId && visible) rafId = requestAnimationFrame(frame);
  }

  resize();

  if (reduceMotion) {
    gl.uniform3f(uniforms.uWeights, 1, 0, 0);
    gl.uniform1f(uniforms.uTime, 4);
    gl.uniform1f(uniforms.uScatter, 0);
    gl.uniform2f(uniforms.uRot, 0.7, -0.16);
    gl.uniform2f(uniforms.uMouse, 10, 10);
    gl.uniform1f(uniforms.uMouseForce, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    window.addEventListener("resize", () => {
      resize();
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, COUNT);
    });
    return;
  }

  window.addEventListener("resize", resize);
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    mouse.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.ty = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    if (dragging) {
      const dx = event.clientX - dragLastX;
      dragLastX = event.clientX;
      drag += dx * 0.006;
      dragVel = dx * 0.0024;
    }
  });
  hero.addEventListener("pointerenter", () => {
    mouse.targetForce = 1;
  });
  hero.addEventListener("pointerleave", () => {
    mouse.targetForce = 0;
    dragging = false;
    hero.classList.remove("is-dragging");
  });
  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    dragLastX = event.clientX;
    hero.classList.add("is-dragging");
    canvas.setPointerCapture(event.pointerId);
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
    hero.classList.remove("is-dragging");
  });
  window.addEventListener("scroll", () => {
    scrollFactor = Math.min(1, window.scrollY / Math.max(hero.offsetHeight * 0.92, 1));
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting && !document.hidden;
    if (visible) schedule();
  });
  observer.observe(hero);
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) schedule();
  });
  schedule();
})();

(function () {
  const hero = document.querySelector("[data-product-hero]");
  if (!hero) return;

  const canvas = hero.querySelector("[data-product-core-canvas]");
  const trigger = hero.querySelector("[data-product-trigger]");
  const steps = Array.from(hero.querySelectorAll("[data-product-step]"));
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const autoPlay = window.matchMedia("(pointer: coarse), (max-width: 760px)").matches;
  const points = [];
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let visible = true;
  let progress = reduceMotion ? 1 : 0.08;
  let targetProgress = progress;
  let dragging = false;
  let buildStart = 0;

  function makePoint(index, total) {
    const v = index / Math.max(total - 1, 1);
    const band = Math.floor(v * 54);
    const turn = v * Math.PI * 2 * 18;
    const shell = Math.sin(v * Math.PI);
    const groove = Math.sin(turn * 1.7 + band * 0.33) * 0.12;
    return {
      theta: turn,
      phi: Math.acos(1 - 2 * v),
      radius: 0.62 + shell * 0.42 + groove,
      seed: Math.random(),
      band
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    points.length = 0;
    const count = width < 520 ? 520 : 860;
    for (let i = 0; i < count; i += 1) points.push(makePoint(i, count));
  }

  function project(point, time) {
    const morph = progress;
    const theta = point.theta + time * (0.28 + morph * 0.18) + pointer.x * 0.35;
    const phi = point.phi + Math.sin(time * 0.7 + point.seed * 8) * 0.02;
    const wave = Math.sin(point.band * 0.74 + time * 2.2) * 0.055 * morph;
    const radius = point.radius + wave;
    let x = Math.sin(phi) * Math.cos(theta) * radius;
    let y = Math.cos(phi) * radius * (0.78 + morph * 0.12);
    let z = Math.sin(phi) * Math.sin(theta) * radius;

    const rotY = -0.55 + pointer.x * 0.38 + morph * 0.28;
    const rotX = 0.28 + pointer.y * 0.22;
    const cy = Math.cos(rotY);
    const sy = Math.sin(rotY);
    const cx = Math.cos(rotX);
    const sx = Math.sin(rotX);

    [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    [y, z] = [y * cx - z * sx, y * sx + z * cx];

    const depth = 2.2 + z;
    const scale = Math.min(width, height) * (0.34 + morph * 0.045) / depth;
    return {
      x: width * 0.5 + x * scale,
      y: height * 0.47 + y * scale,
      z,
      size: (1.05 + point.seed * 2.1) * (1 + morph * 0.45) / depth,
      alpha: 0.2 + point.seed * 0.7,
      seed: point.seed
    };
  }

  function drawRings(time) {
    const cx = width * 0.5;
    const cy = height * 0.48;
    const base = Math.min(width, height);
    for (let i = 0; i < 4; i += 1) {
      const phase = time * (0.34 + i * 0.05) + i * 0.8;
      const rx = base * (0.29 + i * 0.055 + progress * 0.04);
      const ry = base * (0.06 + i * 0.016);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(phase + pointer.x * 0.18);
      ctx.strokeStyle = i % 2 === 0 ? "rgba(125, 219, 213, 0.26)" : "rgba(236, 112, 188, 0.2)";
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 18;
      ctx.shadowColor = i % 2 === 0 ? "rgba(125, 219, 213, 0.42)" : "rgba(236, 112, 188, 0.34)";
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDataStreaks(time) {
    const pulse = 0.55 + Math.sin(time * 3.1) * 0.45;
    const routes = [
      [width * 0.18, height * 0.38, width * 0.5, height * 0.48, "rgba(125, 219, 213,"],
      [width * 0.22, height * 0.56, width * 0.5, height * 0.5, "rgba(187, 167, 255,"],
      [width * 0.5, height * 0.52, width * 0.76, height * 0.66, "rgba(236, 112, 188,"]
    ];
    routes.forEach((route, index) => {
      const [x1, y1, x2, y2, color] = route;
      const active = Math.max(0, Math.min(1, progress * 1.4 - index * 0.22));
      if (active <= 0) return;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, `${color} 0)`);
      grad.addColorStop(0.45, `${color} ${0.15 + pulse * 0.38 * active})`);
      grad.addColorStop(1, `${color} 0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2 + active * 2;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `${color} ${0.35 * active})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(width * 0.36, y1 - 48, width * 0.44, y2 + 54, x2, y2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
  }

  function draw(now) {
    rafId = 0;
    if (!visible) return;
    const time = now * 0.001;
    if (!dragging && !reduceMotion) {
      progress += (targetProgress - progress) * 0.045;
      if (buildStart) {
        const elapsed = Math.min(1, (now - buildStart) / 2300);
        targetProgress = elapsed;
        if (elapsed >= 1) buildStart = 0;
      }
    }
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;

    hero.style.setProperty("--product-progress", progress.toFixed(3));
    hero.style.setProperty("--pointer-x", pointer.x.toFixed(3));
    hero.style.setProperty("--pointer-y", pointer.y.toFixed(3));
    const stage = progress < 0.28 ? 0 : progress < 0.62 ? 1 : progress < 0.92 ? 2 : 3;
    hero.dataset.stage = String(stage);
    steps.forEach((step, index) => step.classList.toggle("is-active", index <= Math.min(stage, 2)));

    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.48, 0, width * 0.5, height * 0.48, Math.min(width, height) * 0.48);
    glow.addColorStop(0, `rgba(125, 219, 213, ${0.14 + progress * 0.14})`);
    glow.addColorStop(0.38, `rgba(187, 167, 255, ${0.09 + progress * 0.08})`);
    glow.addColorStop(1, "rgba(3, 7, 18, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    drawDataStreaks(time);
    drawRings(time);

    const projected = points.map((point) => project(point, time)).sort((a, b) => a.z - b.z);
    projected.forEach((point) => {
      const mix = point.seed;
      const r = Math.round(125 + mix * 115);
      const g = Math.round(210 - mix * 64);
      const b = Math.round(213 + mix * 42);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${point.alpha * (0.34 + progress * 0.46)})`;
      ctx.shadowBlur = 12 + progress * 8;
      ctx.shadowColor = mix > 0.72 ? "rgba(236, 112, 188, 0.42)" : "rgba(125, 219, 213, 0.42)";
      ctx.arc(point.x, point.y, Math.max(0.45, point.size * 2.8), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 26;
    ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
    ctx.fillStyle = `rgba(255, 255, 255, ${0.42 + progress * 0.32})`;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.48, 6 + progress * 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (!reduceMotion) rafId = requestAnimationFrame(draw);
  }

  function schedule() {
    if (!rafId && visible) rafId = requestAnimationFrame(draw);
  }

  function setProgressFromEvent(event) {
    const rect = hero.getBoundingClientRect();
    targetProgress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    progress = targetProgress;
    schedule();
  }

  resize();
  if (reduceMotion) targetProgress = progress = 1;
  schedule();

  window.addEventListener("resize", () => {
    resize();
    schedule();
  });

  trigger?.addEventListener("click", () => {
    hero.classList.add("is-building");
    buildStart = performance.now();
    targetProgress = 0;
    progress = 0;
    schedule();
    window.setTimeout(() => hero.classList.remove("is-building"), reduceMotion ? 0 : 2500);
  });

  hero.addEventListener("pointerdown", (event) => {
    dragging = true;
    hero.setPointerCapture(event.pointerId);
    setProgressFromEvent(event);
  });

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
    if (dragging) setProgressFromEvent(event);
    else schedule();
  });

  hero.addEventListener("pointerup", (event) => {
    dragging = false;
    try {
      hero.releasePointerCapture(event.pointerId);
    } catch (_) {
      // Pointer capture may already be released.
    }
  });

  hero.addEventListener("pointerleave", () => {
    dragging = false;
    pointer.tx = 0;
    pointer.ty = 0;
  });

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting && !document.hidden;
    if (visible) schedule();
  });
  observer.observe(hero);

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) schedule();
  });

  if (autoPlay && !reduceMotion) {
    const values = [0.08, 0.36, 0.68, 1, 0.36];
    let index = 0;
    window.setInterval(() => {
      if (!dragging) {
        targetProgress = values[index % values.length];
        index += 1;
        schedule();
      }
    }, 1800);
  }
})();

(function () {
  const canvases = document.querySelectorAll("[data-ops-stream-canvas]");
  if (!canvases.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  canvases.forEach((canvas) => {
    const lab = canvas.closest("[data-ops-stream]");
    if (!lab) return;

    const ctx = canvas.getContext("2d");
    const particles = [];
    const pointer = { x: 0.5, y: 0.5, active: false };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let visible = true;

    function makeParticle(index) {
      return {
        seed: Math.random(),
        speed: 0.055 + Math.random() * 0.09,
        lane: index % 3,
        size: 0.8 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        colorMix: Math.random()
      };
    }

    function resize() {
      const rect = lab.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles.length = 0;
      const count = width < 720 ? 80 : 150;
      for (let i = 0; i < count; i += 1) particles.push(makeParticle(i));
    }

    function pointOnPath(t, lane, phase) {
      const cx = width * 0.5;
      const cy = height * 0.48;
      const inputY = height * (0.27 + lane * 0.035);
      const outputY = height * (0.64 + lane * 0.035);
      const wave = Math.sin(t * Math.PI * 2 + phase) * 10;

      if (t < 0.5) {
        const p = t / 0.5;
        return {
          x: width * 0.04 + (cx - width * 0.04) * p,
          y: inputY + (cy - inputY) * Math.pow(p, 1.7) + wave * (1 - p),
          stage: 0
        };
      }

      const p = (t - 0.5) / 0.5;
      return {
        x: cx + (width * 0.96 - cx) * p,
        y: cy + (outputY - cy) * Math.pow(p, 0.72) + wave * p,
        stage: 1
      };
    }

    function drawParticleTrail(p, time) {
      const t = (p.seed + time * p.speed) % 1;
      const now = pointOnPath(t, p.lane, p.phase);
      const prev = pointOnPath((t + 0.985) % 1, p.lane, p.phase);
      const glow = Math.max(0, 1 - Math.hypot(now.x - width * pointer.x, now.y - height * pointer.y) / 360);
      const alpha = 0.34 + glow * 0.42 + p.size * 0.045;
      const color = p.stage === 0
        ? `rgba(125, 219, 213, ${alpha})`
        : `rgba(255, 134, 202, ${alpha})`;

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, p.size * 0.8);
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(now.x, now.y);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(now.x, now.y, p.size + glow * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    function draw(now) {
      rafId = 0;
      if (!visible) return;

      const time = now * 0.001;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const coreGlow = ctx.createRadialGradient(width * 0.5, height * 0.48, 0, width * 0.5, height * 0.48, Math.min(width, height) * 0.34);
      coreGlow.addColorStop(0, "rgba(125, 219, 213, 0.18)");
      coreGlow.addColorStop(0.46, "rgba(255, 134, 202, 0.08)");
      coreGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((particle) => drawParticleTrail(particle, reduceMotion ? 9 : time));
      ctx.globalCompositeOperation = "source-over";

      if (!reduceMotion) rafId = requestAnimationFrame(draw);
    }

    function schedule() {
      if (!rafId && visible) rafId = requestAnimationFrame(draw);
    }

    lab.addEventListener("pointermove", (event) => {
      const rect = lab.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / Math.max(rect.width, 1);
      pointer.y = (event.clientY - rect.top) / Math.max(rect.height, 1);
      pointer.active = true;
      schedule();
    });

    window.addEventListener("resize", () => {
      resize();
      schedule();
    });

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting && !document.hidden;
      if (visible) schedule();
    });
    observer.observe(lab);

    document.addEventListener("visibilitychange", () => {
      visible = !document.hidden;
      if (visible) schedule();
    });

    resize();
    schedule();
  });
})();
