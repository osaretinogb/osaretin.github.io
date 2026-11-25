const canvas = document.querySelector('.ambient-waves');
const context = canvas.getContext('2d');
const control = document.querySelector('.motion-control');
const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (context) {
  const ribbons = [
    { offset: -.045, phase: .2, depth: .039, color: '143, 193, 255' },
    { offset: -.015, phase: 1.7, depth: .061, color: '129, 150, 250' },
    { offset: .021, phase: 2.9, depth: .054, color: '203, 176, 255' },
    { offset: .047, phase: 4.7, depth: .076, color: '166, 141, 244' },
  ];
  const segments = 48;
  const frameInterval = 32;
  let width;
  let height;
  let elapsed = 0;
  let lastFrame = 0;
  let frame;
  let paused = false;

  function ribbonHeight(progress, ribbon) {
    const sway = elapsed * .17;
    const arc = .44 + .19 * Math.sin(Math.PI * progress) - .07 * progress;
    const ripple = .063 * Math.sin(progress * 5.8 + ribbon.phase + sway);
    const drift = .034 * Math.cos(progress * 3.3 - sway * .58 + ribbon.phase);
    return arc + ribbon.offset + ripple + drift;
  }

  function trace(ribbon, lowerEdge) {
    for (let step = 0; step <= segments; step += 1) {
      const progress = (lowerEdge ? segments - step : step) / segments;
      const thickness = ribbon.depth * (.65 + .35 * Math.sin(progress * 7 + ribbon.phase - elapsed * .12));
      const x = progress * width;
      const y = height * (ribbonHeight(progress, ribbon) + (lowerEdge ? thickness : 0));
      if (step === 0 && !lowerEdge) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
  }

  function draw() {
    context.clearRect(0, 0, width, height);

    for (const ribbon of ribbons) {
      context.beginPath();
      trace(ribbon, false);
      trace(ribbon, true);
      context.closePath();
      context.fillStyle = ribbon.fill;
      context.fill();

      context.beginPath();
      trace(ribbon, false);
      context.strokeStyle = ribbon.edge;
      context.lineWidth = 5;
      context.globalAlpha = .17;
      context.stroke();
      context.lineWidth = 1.15;
      context.globalAlpha = 1;
      context.stroke();
    }
  }

  function fitCanvas() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 1.25, 1920 / Math.max(width, 1));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    context.setTransform(scale, 0, 0, scale, 0, 0);

    for (const ribbon of ribbons) {
      const fill = context.createLinearGradient(0, 0, width, 0);
      fill.addColorStop(0, `rgba(${ribbon.color}, .065)`);
      fill.addColorStop(.45, `rgba(${ribbon.color}, .12)`);
      fill.addColorStop(1, `rgba(${ribbon.color}, .09)`);
      const edge = context.createLinearGradient(0, 0, width, 0);
      edge.addColorStop(0, `rgba(${ribbon.color}, .27)`);
      edge.addColorStop(.52, `rgba(${ribbon.color}, .38)`);
      edge.addColorStop(1, `rgba(${ribbon.color}, .32)`);
      ribbon.fill = fill;
      ribbon.edge = edge;
    }

    draw();
  }

  function animate(time) {
    const delta = time - lastFrame;
    if (delta >= frameInterval) {
      elapsed += Math.min(delta, 70) / 1000;
      lastFrame = time;
      draw();
    }
    frame = requestAnimationFrame(animate);
  }

  function updateMotion() {
    const reduce = reducedMotion.matches;
    control.hidden = reduce;
    control.textContent = paused ? 'Resume motion' : 'Pause motion';
    root.classList.toggle('motion-paused', paused || reduce);
    cancelAnimationFrame(frame);

    if (!paused && !reduce && !document.hidden) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(animate);
    }
  }

  control.addEventListener('click', () => {
    paused = !paused;
    updateMotion();
  });
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  window.addEventListener('resize', fitCanvas);

  if (!reducedMotion.matches && !window.location.hash) {
    root.classList.add('motion-ready');
  }
  fitCanvas();
  updateMotion();
}
