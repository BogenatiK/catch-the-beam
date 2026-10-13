(function () {
  "use strict";

  // ---------- DOM ----------
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const batteryFill = document.getElementById("battery-fill");
  const batteryValue = document.getElementById("battery-value");
  const progressValue = document.getElementById("progress-value");
  const progressFill = document.getElementById("progress-fill");

  const menuScreen = document.getElementById("menu-screen");
  const resultScreen = document.getElementById("result-screen");
  const resultTitle = document.getElementById("result-title");
  const resultText = document.getElementById("result-text");
  const restartBtn = document.getElementById("restart-btn");
  const menuBtn = document.getElementById("menu-btn");
  const difficultyBtns = document.querySelectorAll(".difficulty-btn");

  // ---------- Размеры ----------
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  // ---------- Сложность ----------
  const DIFFICULTY = {
    easy: {
      label: "Лёгкий",
      worldSpeed: 180,          // px/сек, скорость «движения» мира справа налево
      drainPerSec: 3.5,         // % заряда в секунду
      beamHealAmount: 12,       // % за пойманный луч
      beamSpawnInterval: 1400,  // мс
      asteroidSpawnInterval: 1600,
      asteroidMinSize: 26,
      asteroidMaxSize: 40,
      tripDuration: 45          // сек до Марса
    },
    medium: {
      label: "Средний",
      worldSpeed: 260,
      drainPerSec: 5,
      beamHealAmount: 9,
      beamSpawnInterval: 1100,
      asteroidSpawnInterval: 1100,
      asteroidMinSize: 24,
      asteroidMaxSize: 46,
      tripDuration: 60
    },
    hard: {
      label: "Сложный",
      worldSpeed: 360,
      drainPerSec: 7,
      beamHealAmount: 6,
      beamSpawnInterval: 900,
      asteroidSpawnInterval: 780,
      asteroidMinSize: 22,
      asteroidMaxSize: 52,
      tripDuration: 75
    }
  };

  // ---------- Состояние ----------
  const state = {
    running: false,
    difficulty: "easy",
    config: DIFFICULTY.easy,
    sail: { x: 0, y: 0, r: 26, angle: 0 },
    pointer: { x: 0, active: false },
    objects: [],       // {type: 'beam'|'asteroid', x, y, r, vx, speedMul, spin, rot, points[]}
    battery: 100,
    progress: 0,       // 0..1
    elapsed: 0,        // сек с начала полёта
    lastSpawnBeam: 0,
    lastSpawnAsteroid: 0,
    lastFrameTime: 0,
    rafId: null,
    shakeTime: 0
  };

  // ---------- Утилиты ----------
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const randRange = (a, b) => a + Math.random() * (b - a);

  // ---------- Управление ----------
  function setPointer(clientX) {
    const rect = canvas.getBoundingClientRect();
    state.pointer.x = clientX - rect.left;
    state.pointer.active = true;
  }

  canvas.addEventListener("mousemove", (e) => setPointer(e.clientX));
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length) setPointer(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length) setPointer(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });

  // ---------- Спавн объектов ----------
  function spawnBeam() {
    const r = 12;
    state.objects.push({
      type: "beam",
      x: W + r + 20,
      y: randRange(r + 60, H - r - 60),
      r,
      vx: -(state.config.worldSpeed + randRange(-20, 20)),
      angle: 0,
      spin: 0,
      rot: 0
    });
  }

  function makeAsteroidShape(r) {
    const points = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * randRange(0.78, 1.12);
      points.push({ a, r: rr });
    }
    return points;
  }

  function spawnAsteroid() {
    const cfg = state.config;
    const r = randRange(cfg.asteroidMinSize, cfg.asteroidMaxSize);
    state.objects.push({
      type: "asteroid",
      x: W + r + 30,
      y: randRange(r + 30, H - r - 30),
      r,
      vx: -(cfg.worldSpeed * randRange(0.9, 1.15)),
      angle: 0,
      spin: randRange(-1.2, 1.2),
      rot: randRange(0, Math.PI * 2),
      points: makeAsteroidShape(r)
    });
  }

  // ---------- Обновление ----------
  function updateSail(dt) {
    const sail = state.sail;

    // Парус двигается только по горизонтали
    const targetX = state.pointer.active ? state.pointer.x : W / 2;

    // Плавное следование
    sail.x += (targetX - sail.x) * 0.22;

    // Наклон в сторону движения — для визуала
    const desiredTilt = clamp((targetX - sail.x) * 0.01, -0.5, 0.5);
    sail.angle += (desiredTilt - sail.angle) * 0.2;

    // Ограничение
    sail.x = clamp(sail.x, sail.r, W - sail.r);
    sail.y = H * 0.55; // фиксированная высота — «полёт вперёд»
  }

  function circleVsSail(obj) {
    const dx = obj.x - state.sail.x;
    const dy = obj.y - state.sail.y;
    const dist = Math.hypot(dx, dy);
    return dist < obj.r + state.sail.r * 0.9;
  }

  function updateObjects(dt) {
    const cfg = state.config;
    const sail = state.sail;

    for (let i = state.objects.length - 1; i >= 0; i--) {
      const o = state.objects[i];
      o.x += o.vx * dt;

      // Вращение астероида
      if (o.type === "asteroid") o.rot += o.spin * dt;

      // Столкновение
      if (circleVsSail(o)) {
        if (o.type === "beam") {
          state.battery = Math.min(100, state.battery + cfg.beamHealAmount);
          state.objects.splice(i, 1);
          continue;
        } else {
          // Астероид — мгновенный проигрыш
          endGame("asteroid");
          return;
        }
      }

      // Вылетел за пределы экрана слева
      if (o.x + o.r < -40) {
        state.objects.splice(i, 1);
      }
    }
  }

  function updateProgressAndBattery(dt) {
    const cfg = state.config;

    // Прогресс — равномерно по времени
    state.elapsed += dt;
    state.progress = clamp(state.elapsed / cfg.tripDuration, 0, 1);

    // Расход заряда
    state.battery -= cfg.drainPerSec * dt;

    // Обновление HUD
    batteryFill.style.width = Math.max(0, state.battery) + "%";
    batteryValue.textContent = Math.max(0, Math.round(state.battery)) + "%";
    progressFill.style.width = (state.progress * 100) + "%";
    progressValue.textContent = Math.round((1 - state.progress) * 100) + "%";

    // Проверки конца
    if (state.battery <= 0) {
      endGame("battery");
      return;
    }
    if (state.progress >= 1) {
      endGame("win");
    }
  }

  // ---------- Отрисовка ----------
  function drawBackground() {
    // Звёздное небо — мягкий градиент
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#050a1c");
    g.addColorStop(0.5, "#081226");
    g.addColorStop(1, "#05070f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Смещающиеся звёзды — эффект движения вперёд
    const t = state.elapsed * state.config.worldSpeed;
    for (let i = 0; i < 90; i++) {
      const baseX = (i * 97.31) % W;
      const sx = ((baseX - t * 0.4) % W + W) % W;
      const sy = ((i * 53.17) % H);
      const size = (i % 3 === 0) ? 1.6 : 1;
      ctx.fillStyle = "rgba(180, 210, 255, 0.6)";
      ctx.fillRect(sx, sy, size, size);
    }

    // Полоса «тени» снизу — визуальная опора
    const shade = ctx.createLinearGradient(0, H * 0.7, 0, H);
    shade.addColorStop(0, "rgba(10, 20, 50, 0)");
    shade.addColorStop(1, "rgba(5, 10, 25, 0.85)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, H * 0.7, W, H * 0.3);
  }

  function drawBeam(o) {
    // Свечение
    const glow = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3);
    glow.addColorStop(0, "rgba(255, 240, 160, 0.95)");
    glow.addColorStop(0.4, "rgba(255, 210, 100, 0.5)");
    glow.addColorStop(1, "rgba(255, 200, 80, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r * 3, 0, Math.PI * 2);
    ctx.fill();

    // Хвост
    const tail = ctx.createLinearGradient(o.x + o.r * 3, o.y, o.x - o.r * 4, o.y);
    tail.addColorStop(0, "rgba(255, 230, 140, 0.6)");
    tail.addColorStop(1, "rgba(255, 230, 140, 0)");
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y - o.r * 0.7);
    ctx.lineTo(o.x + o.r * 4, o.y);
    ctx.lineTo(o.x, o.y + o.r * 0.7);
    ctx.closePath();
    ctx.fill();

    // Ядро
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = "#fff4c2";
    ctx.fill();
  }

  function drawAsteroid(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot);

    ctx.beginPath();
    const pts = o.points;
    ctx.moveTo(Math.cos(pts[0].a) * pts[0].r, Math.sin(pts[0].a) * pts[0].r);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(Math.cos(pts[i].a) * pts[i].r, Math.sin(pts[i].a) * pts[i].r);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(-o.r * 0.3, -o.r * 0.3, o.r * 0.1, 0, 0, o.r);
    grad.addColorStop(0, "#8a8f99");
    grad.addColorStop(0.6, "#5a5f6b");
    grad.addColorStop(1, "#2c3038");
    ctx.fillStyle = grad;
    ctx.fill();

    // Крапинки
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    for (let i = 0; i < 3; i++) {
      const a = (i * 2.1) % (Math.PI * 2);
      const rr = o.r * 0.45;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, o.r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawSail() {
    const sail = state.sail;
    ctx.save();
    ctx.translate(sail.x, sail.y);

    // Свечение
    const glow = ctx.createRadialGradient(0, 0, sail.r * 0.4, 0, 0, sail.r * 2.4);
    glow.addColorStop(0, "rgba(255, 220, 120, 0.55)");
    glow.addColorStop(1, "rgba(255, 220, 120, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, sail.r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Корпус — круглая капсула с парусом
    ctx.rotate(sail.angle);

    ctx.beginPath();
    ctx.arc(0, 0, sail.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(30, 60, 110, 0.95)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#ffe27a";
    ctx.stroke();

    // Треугольный парус
    ctx.beginPath();
    ctx.moveTo(-sail.r * 0.15, -sail.r * 0.75);
    ctx.lineTo(sail.r * 0.85, 0);
    ctx.lineTo(-sail.r * 0.15, sail.r * 0.75);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 226, 122, 0.9)";
    ctx.fill();

    ctx.restore();

    // Планета-цель вверху справа — маленький Марс
    drawDestination();
  }

  function drawDestination() {
    const mx = W - 60;
    const my = H * 0.18;
    const r = 16;
    const g = ctx.createRadialGradient(mx - r * 0.3, my - r * 0.3, r * 0.2, mx, my, r);
    g.addColorStop(0, "#ffb27a");
    g.addColorStop(0.7, "#c85a3a");
    g.addColorStop(1, "#5a2418");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function render() {
    drawBackground();
    for (const o of state.objects) {
      if (o.type === "beam") drawBeam(o);
      else drawAsteroid(o);
    }
    drawSail();
  }

  // ---------- Игровой цикл ----------
  function loop(now) {
    if (!state.running) return;

    if (state.lastFrameTime === 0) state.lastFrameTime = now;
    let dt = (now - state.lastFrameTime) / 1000;
    state.lastFrameTime = now;
    if (dt > 0.05) dt = 0.05;

    // Спавн
    if (now - state.lastSpawnBeam >= state.config.beamSpawnInterval) {
      state.lastSpawnBeam = now;
      spawnBeam();
    }
    if (now - state.lastSpawnAsteroid >= state.config.asteroidSpawnInterval) {
      state.lastSpawnAsteroid = now;
      spawnAsteroid();
    }

    updateSail(dt);
    updateObjects(dt);
    if (!state.running) return; // если произошёл проигрыш
    updateProgressAndBattery(dt);
    if (!state.running) return;

    render();

    state.rafId = requestAnimationFrame(loop);
  }

  // ---------- Управление игрой ----------
  function startGame(key) {
    state.difficulty = key;
    state.config = DIFFICULTY[key];

    state.running = true;
    state.objects = [];
    state.battery = 100;
    state.progress = 0;
    state.elapsed = 0;
    state.lastFrameTime = 0;

    state.sail.x = W / 2;
    state.sail.y = H * 0.55;
    state.sail.r = clamp(Math.min(W, H) * 0.05, 20, 32);
    state.sail.angle = 0;

    state.pointer.x = W / 2;
    state.pointer.active = false;

    const t = performance.now();
    state.lastSpawnBeam = t + 600;       // первый луч чуть позже старта
    state.lastSpawnAsteroid = t + 1200;  // первый астероид ещё позже

    batteryFill.style.width = "100%";
    batteryValue.textContent = "100%";
    progressFill.style.width = "0%";
    progressValue.textContent = "100%";

    menuScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");

    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(loop);
  }

  function endGame(reason) {
    state.running = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    if (reason === "win") {
      resultTitle.textContent = "Марс достигнут!";
      resultText.textContent =
        "Сложность: " + state.config.label +
        ". Остаток заряда: " + Math.round(state.battery) + "%.";
    } else if (reason === "battery") {
      resultTitle.textContent = "Заряд исчерпан";
      resultText.textContent =
        "Парус остался в дрейфе на " +
        Math.round(state.progress * 100) + "% пути к Марсу.";
    } else if (reason === "asteroid") {
      resultTitle.textContent = "Столкновение!";
      resultText.textContent =
        "Астероид разрушил парус на " +
        Math.round(state.progress * 100) + "% пути к Марсу.";
    }

    resultScreen.classList.remove("hidden");
  }

  function goToMenu() {
    state.running = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    resultScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  }

  // ---------- Кнопки ----------
  difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", () => startGame(btn.dataset.difficulty));
  });
  restartBtn.addEventListener("click", () => startGame(state.difficulty));
  menuBtn.addEventListener("click", goToMenu);

  // ---------- Init ----------
  resize();
})();
