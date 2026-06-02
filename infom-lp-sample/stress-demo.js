(function () {
  const demo = document.querySelector("[data-stress-demo]");
  if (!demo) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse), (max-width: 720px)").matches;
  const trigger = demo.querySelector("[data-demo-trigger]");
  const stageLabel = demo.querySelector("[data-stage-label]");
  const stageBar = demo.querySelector("[data-stage-bar]");
  const steps = Array.from(demo.querySelectorAll("[data-demo-step]"));
  const labels = ["Answer", "Analyze", "Insight", "Care Plan"];
  let progress = reduceMotion ? 100 : 0;
  let dragging = false;
  let autoTimer = null;

  function setProgress(value) {
    progress = Math.max(0, Math.min(100, value));
    const stage = progress < 35 ? 0 : progress < 70 ? 1 : progress < 96 ? 2 : 3;
    demo.style.setProperty("--demo-progress", `${progress}%`);
    demo.dataset.stage = String(stage);
    stageBar.style.width = `${progress}%`;
    stageLabel.textContent = labels[stage];
    steps.forEach((step, index) => {
      step.classList.toggle("active", index <= Math.min(stage, 2));
    });
  }

  function analyze() {
    demo.classList.add("is-analyzing");
    const sequence = [18, 42, 72, 100];
    sequence.forEach((value, index) => {
      window.setTimeout(() => setProgress(value), reduceMotion ? 0 : index * 260);
    });
    window.setTimeout(() => demo.classList.remove("is-analyzing"), reduceMotion ? 0 : 1250);
  }

  function pointerRatio(event) {
    const rect = demo.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * 100;
  }

  function startAuto() {
    if (!coarsePointer || reduceMotion) return;
    const sequence = [0, 38, 72, 100, 38];
    let index = 0;
    autoTimer = window.setInterval(() => {
      setProgress(sequence[index % sequence.length]);
      index += 1;
    }, 1900);
  }

  trigger.addEventListener("click", analyze);

  demo.addEventListener("pointerdown", (event) => {
    dragging = true;
    demo.setPointerCapture(event.pointerId);
    setProgress(pointerRatio(event));
  });

  demo.addEventListener("pointermove", (event) => {
    const rect = demo.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
    if (!reduceMotion && !coarsePointer) {
      demo.style.setProperty("--tilt-x", `${y}deg`);
      demo.style.setProperty("--tilt-y", `${x}deg`);
    }
    if (dragging) setProgress(pointerRatio(event));
  });

  demo.addEventListener("pointerup", (event) => {
    dragging = false;
    try {
      demo.releasePointerCapture(event.pointerId);
    } catch (_) {
      // Pointer may already be released by the browser.
    }
  });

  demo.addEventListener("pointerleave", () => {
    dragging = false;
    if (!reduceMotion) {
      demo.style.setProperty("--tilt-x", "0deg");
      demo.style.setProperty("--tilt-y", "0deg");
    }
  });

  demo.addEventListener("focusin", () => setProgress(Math.max(progress, 35)));
  setProgress(progress);
  startAuto();

  window.addEventListener("beforeunload", () => {
    if (autoTimer) window.clearInterval(autoTimer);
  });
})();
