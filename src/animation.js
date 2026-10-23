// Perspective projection keeps the 3D scene lightweight and independent of WebGL.
export function initAnimation() {
  const canvas = document.querySelector("#data-canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const button = document.querySelector("#motion-toggle");
  let width = 0,
    height = 0,
    frame = 0,
    visible = true;
  let paused = reduce.matches,
    elapsed = 0,
    previous = 0;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const hero = document.querySelector(".hero");
  const animated = document.querySelectorAll(
    ".case-visual, .ai-grid, .pipeline-track, .contact, .hero",
  );
  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries)
      entry.target.classList.toggle("in-view", entry.isIntersecting);
  });
  animated.forEach((el) => visibility.observe(el));

  function project(x, y, z, rotation, radius, cx, cy) {
    const yaw = rotation + pointer.x * 0.25;
    const tilt = 0.38 + pointer.y * 0.2;
    const rx = x * Math.cos(yaw) - z * Math.sin(yaw);
    const rz = x * Math.sin(yaw) + z * Math.cos(yaw);
    const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
    const depth = y * Math.sin(tilt) + rz * Math.cos(tilt);
    const perspective = 3.6 / (3.6 + depth);
    return {
      x: cx + rx * radius * perspective,
      y: cy + ry * radius * perspective,
      depth,
      scale: perspective,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const mobile = width < 760;
    const radius = Math.min(width * (mobile ? 0.34 : 0.185), height * 0.32);
    const cx = width * (mobile ? 0.53 : 0.76),
      cy = height * (mobile ? 0.73 : 0.47);
    const rotation = elapsed * 0.00013;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.9);
    glow.addColorStop(0, "#7464ff30");
    glow.addColorStop(0.48, "#4445c51c");
    glow.addColorStop(1, "#06091000");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    // Orbit paths rotate in separate planes; depth controls light and line weight.
    for (let orbit = 0; orbit < 4; orbit++) {
      const points = [];
      for (let j = 0; j <= 120; j++) {
        const a = (j / 120) * Math.PI * 2;
        const r = 1.3 + orbit * 0.13;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * Math.cos(orbit * 0.8 + 0.3);
        const z = Math.sin(a) * r * Math.sin(orbit * 0.8 + 0.3);
        points.push(
          project(x, y, z, rotation * (orbit % 2 ? -0.5 : 0.4), radius, cx, cy),
        );
      }
      ctx.beginPath();
      points.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.strokeStyle = orbit % 2 ? "#ac94ff50" : "#79bbff45";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      const packet = points[Math.floor((elapsed * 0.012 + orbit * 29) % 120)];
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#b3a2ff";
      ctx.fillStyle = "#ded6ff";
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    const rows = mobile ? 13 : 19,
      columns = mobile ? 24 : 36;
    const grid = [];
    for (let row = 0; row <= rows; row++) {
      const latitude = (row / rows) * Math.PI;
      const line = [];
      for (let col = 0; col <= columns; col++) {
        const longitude = (col / columns) * Math.PI * 2;
        const ripple =
          1 + 0.025 * Math.sin(longitude * 5 + elapsed * 0.0008 + latitude * 3);
        line.push(
          project(
            Math.sin(latitude) * Math.cos(longitude) * ripple,
            Math.cos(latitude) * ripple,
            Math.sin(latitude) * Math.sin(longitude) * ripple,
            rotation,
            radius,
            cx,
            cy,
          ),
        );
      }
      grid.push(line);
    }
    for (let row = 0; row <= rows; row++)
      for (let col = 0; col < columns; col++) {
        const p = grid[row][col];
        const alpha = p.depth < 0 ? 0.42 : 0.1;
        ctx.strokeStyle = `rgba(157,150,255,${alpha})`;
        ctx.lineWidth = p.depth < 0 ? 0.8 : 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(grid[row][col + 1].x, grid[row][col + 1].y);
        if (row < rows) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(grid[row + 1][col].x, grid[row + 1][col].y);
        }
        ctx.stroke();
        if ((row + col) % 3 === 0 && p.depth < 0.2) {
          ctx.fillStyle = `rgba(211,219,255,${p.depth < 0 ? 0.85 : 0.2})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.scale * 1.05, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    // Slow background star drift and inbound data streaks.
    for (let i = 0; i < (mobile ? 25 : 65); i++) {
      const x = (i * 173.91 + elapsed * 0.004) % width;
      const y = (i * 97.73) % height;
      ctx.fillStyle = `rgba(180,188,235,${0.15 + (i % 4) * 0.09})`;
      ctx.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 5; i++) {
      const progress = (elapsed * 0.00009 + i * 0.21) % 1;
      const x = cx - radius * 2.5 + progress * radius * 5;
      const y = cy + (i - 2) * radius * 0.48;
      const gradient = ctx.createLinearGradient(x - 70, y, x, y);
      gradient.addColorStop(0, "#9a95ff00");
      gradient.addColorStop(1, "#9a95ff65");
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x - 70, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio, 1.5);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function tick(now) {
    frame = 0;
    if (previous) elapsed += Math.min(now - previous, 50);
    previous = now;
    pointer.x += (pointer.targetX - pointer.x) * 0.045;
    pointer.y += (pointer.targetY - pointer.y) * 0.045;
    draw();
    if (visible && !paused && !document.hidden)
      frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    button.textContent = paused ? "Enable motion" : "Pause motion";
    button.setAttribute("aria-pressed", String(paused));
    document.documentElement.classList.toggle("motion-paused", paused);
    document.dispatchEvent(
      new CustomEvent("portfolio:motion", { detail: { paused } }),
    );
    if (visible && !paused && !document.hidden)
      frame = requestAnimationFrame(tick);
    else draw();
  }
  hero.addEventListener("pointermove", (e) => {
    if (paused || !finePointer.matches) return;
    const r = hero.getBoundingClientRect();
    pointer.targetX = (e.clientX - r.left) / r.width - 0.5;
    pointer.targetY = (e.clientY - r.top) / r.height - 0.5;
  });
  hero.addEventListener("pointerleave", () => {
    pointer.targetX = pointer.targetY = 0;
  });
  button.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  reduce.addEventListener("change", () => {
    paused = reduce.matches;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(canvas);
  window.addEventListener("resize", resize);
  resize();
  sync();
}
