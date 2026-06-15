(function () {
  const canvas = document.querySelector("[data-studio-particles]");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  const hero = canvas.closest(".studio-hero");
  const points = [];
  const pointer = { x: 0.72, y: 0.34, active: false };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let visible = true;

  function resize() {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    points.length = 0;
    const count = width < 760 ? 90 : 150;
    for (let i = 0; i < count; i += 1) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.8 + 0.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function draw(now) {
    rafId = 0;
    if (!visible) return;

    const time = now * 0.001;
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(width * pointer.x, height * pointer.y, 0, width * pointer.x, height * pointer.y, Math.max(width, height) * 0.7);
    gradient.addColorStop(0, "rgba(126, 219, 213, 0.16)");
    gradient.addColorStop(0.42, "rgba(122, 112, 255, 0.08)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      if (!reduceMotion) {
        p.x += p.vx * (0.55 + p.z);
        p.y += p.vy * (0.55 + p.z) + Math.sin(time + p.phase) * 0.025;
      }

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      const dx = p.x - width * pointer.x;
      const dy = p.y - height * pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const glow = Math.max(0, 1 - distance / 360);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${120 + glow * 90}, ${180 + glow * 55}, 255, ${0.22 + p.z * 0.45})`;
      ctx.arc(p.x, p.y, p.r + glow * 1.2, 0, Math.PI * 2);
      ctx.fill();

      if (glow > 0.62 && i % 4 === 0) {
        ctx.strokeStyle = `rgba(157, 220, 255, ${(glow - 0.62) * 0.22})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(width * pointer.x, height * pointer.y);
        ctx.stroke();
      }
    }

    if (!reduceMotion) rafId = requestAnimationFrame(draw);
  }

  function schedule() {
    if (!rafId && visible) rafId = requestAnimationFrame(draw);
  }

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
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
  observer.observe(hero);

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) schedule();
  });

  resize();
  schedule();
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
