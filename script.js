(function () {
  "use strict";

  // ---------- DOM ----------
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const caughtEl = document.getElementById("caught-count");
  const missedEl = document.getElementById("missed-count");
  const menuScreen = document.getElementById("menu-screen");
  const resultScreen = document.getElementById("result-screen");
  const resultTitle = document.getElementById("result-title");
  const resultText = document.getElementById("result-text");
  const restartBtn = document.getElementById("restart-btn");
  const menuBtn = document.getElementById("menu-btn");
  const difficultyBtns = document.querySelectorAll(".difficulty-btn");

  // ---------- Размеры ----------
  let W = 0;
  let H = 0;
  let DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Пересчёт позиции паруса при изменении размеров
    if (state.sail) {
      state.sail.x = clamp(state.sail.x, state.sail.r, W - state.sail.r);
      state.sail.y = clamp(state.sail.y, state.sail.r, H - state.sail.r);
      // Если игра не активна — центрируем
      if (!state.running) {
        state.sail.x = W / 2;
        state.sail.y = H / 2;
      }
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  // ---------- Настройки сложности ----------
  const DIFFICULTY = {
    easy: {
      label: "Лёгкий",
      spawnInterval: 900,   // мс между лучами
      beamSpeed: 130,       // px/сек
      maxMissed: 5,
      totalBeams: 12,
      beamRadius: 9
    },
    medium: {
      label: "Средний",
      spawnInterval: 650,
      beamSpeed: 190,
      maxMissed: 4,
      totalBeams: 16,
      beamRadius: 8
    },
    hard: {
      label: "Сложный",
      spawnInterval: 450,
      beamSpeed: 260,
      maxMissed: 3,
      totalBeams: 20,
      beamRadius: 7
    }
  };

  // ---------- Состояние игры ----------
  const state = {
    running: false,
    difficulty: "easy",
    config: DIFFICULTY.easy,
    sail: {
      x: 0,
      y: 0,
      r: 34,
      angle: 0
    },
    beams: [],
    caught: 0,
    missed: 0,
    spawned: 0,
    lastSpawnTime: 0,
    lastFrameTime: 0,
    rafId: null,
    pointer: { x: 0, y: 0, active: false }
  };

  // ---------- Утилиты ----------
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function randRange(a, b) {
    return a + Math.random() * (b - a);
  }

  // ---------- Управление ----------
  function setPointer(x, y) {
    state.pointer.x = x;
    state.pointer.y = y;
    state.pointer.active = true;
  }

  function handleMouseMove(e) {
    setPointer(e.clientX, e.clientY);
  }

  function handleTouchMove(e) {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    setPointer(t.clientX, t.clientY);
    e.preventDefault();
  }

  function handleTouchStart(e) {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    setPointer(t.clientX, t.clientY);
    e.preventDefault();
  }

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

  // ---------- Логика паруса ----------
  function updateSail(dt) {
    const sail = state.sail;
    const targetX = state.pointer.active ? state.pointer.x : W / 2;
    const targetY = state.pointer.active ? state.pointer.y : H / 2;

    // Плавное следование за указателем
    const follow = 0.18;
    sail.x += (targetX - sail.x) * follow;
    sail.y += (targetY - sail.y) * follow;

    // Ограничение по краям
    sail.x = clamp(sail.x, sail.r, W - sail.r);
    sail.y = clamp(sail.y, sail.r, H - sail.r);

    // Поворот паруса — в сторону движения
    const dx = targetX - sail.x;
    const dy = targetY - sail.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      sail.angle = Math.atan2(dy, dx);
    }
  }

  // ---------- Логика лучей ----------
  function spawnBeam() {
    const cfg = state.config;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const margin = 30;

    if (side === 0) {         // сверху
      x = randRange(margin, W - margin);
      y = -margin;
    } else if (side === 1) {  // справа
      x = W + margin;
      y = randRange(margin, H - margin);
    } else if (side === 2) {  // снизу
      x = randRange(margin, W - margin);
      y = H + margin;
    } else {                  // слева
      x = -margin;
      y = randRange(margin, H - margin);
    }

    // Направление — примерно в центр (с небольшим разбросом)
    const targetX = W / 2 + randRange(-W * 0.15, W * 0.15);
    const targetY = H / 2 + randRange(-H * 0.15, H * 0.15);
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;

    state.beams.push({
      x: x,
      y: y,
      vx: nx * cfg.beamSpeed,
      vy: ny * cfg.beamSpeed,
      r: cfg.beamRadius,
      alive: true
    });

    state.spawned++;
  }

  function updateBeams(dt) {
    const sail = state.sail;
    const cfg = state.config;

    for (let i = state.beams.length - 1; i >= 0; i--) {
      const b = state.beams[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Столкновение с парусом
      const dx = b.x - sail.x;
      const dy = b.y - sail.y;
      const dist = Math.hypot(dx, dy);
      if (dist < sail.r + b.r) {
        state.beams.splice(i, 1);
        state.caught++;
        caughtEl.textContent = state.caught;
        continue;
      }

      // Выход за пределы экрана
      const pad = 60;
      if (b.x < -pad || b.x > W + pad || b.y < -pad || b.y > H + pad) {
        state.beams.splice(i, 1);
        state.missed++;
        missedEl.textContent = state.missed;
        if (state.missed >= cfg.maxMissed) {
          endGame(false);
          return;
        }
      }
    }
  }

  // ---------- Отрисовка ----------
  function drawBackground() {
    // Звёздное небо с лёгким градиентом
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H));
    g.addColorStop(0, "#0b1730");
    g.addColorStop(1, "#05070f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Мелкие звёзды (детерминированные — рисуем каждый кадр одинаково)
    ctx.fillStyle = "rgba(180, 210, 255, 0.55)";
    const starCount = 60;
    for (let i = 0; i < starCount; i++) {
      const sx = ((i * 9301 + 49297) % 233280) / 233280 * W;
      const sy = ((i * 4523 + 12345) % 199999) / 199999 * H;
      ctx.fillRect(sx, sy, 1.4, 1.4);
    }
  }

  function drawSail() {
    const sail = state.sail;
    ctx.save();
    ctx.translate(sail.x, sail.y);

    // Свечение вокруг паруса
    const glow = ctx.createRadialGradient(0, 0, sail.r * 0.4, 0, 0, sail.r * 2.2);
    glow.addColorStop(0, "rgba(255, 220, 120, 0.55)");
    glow.addColorStop(1, "rgba(255, 220, 120, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, sail.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Корпус паруса — поворачивается
    ctx.rotate(sail.angle);
    ctx.beginPath();
    ctx.arc(0, 0, sail.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(30, 60, 110, 0.9)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffe27a";
    ctx.stroke();

    // «Парус» — треугольная форма внутри
    ctx.beginPath();
    ctx.moveTo(-sail.r * 0.2, -sail.r * 0.7);
    ctx.lineTo(sail.r * 0.75, 0);
    ctx.lineTo(-sail.r * 0.2, sail.r * 0.7);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 226, 122, 0.85)";
    ctx.fill();

    ctx.restore();
  }

  function drawBeams() {
    for (const b of state.beams) {
      // Свечение луча
      const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3);
      glow.addColorStop(0, "rgba(255, 240, 160, 0.9)");
      glow.addColorStop(1, "rgba(255, 200, 80, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 3, 0, Math.PI * 2);
      ctx.fill();

      // Ядро луча
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff4c2";
      ctx.fill();
    }
  }

  function render() {
    drawBackground();
    drawBeams();
    drawSail();
  }

  // ---------- Игровой цикл ----------
  function loop(now) {
    if (!state.running) return;

    if (!state.lastFrameTime) state.lastFrameTime = now;
    let dt = (now - state.lastFrameTime) / 1000;
    state.lastFrameTime = now;
    // Ограничим dt, чтобы при переключении вкладки не было рывков
    if (dt > 0.05) dt = 0.05;

    // Спавн лучей
    if (state.spawned < state.config.totalBeams) {
      if (now - state.lastSpawnTime >= state.config.spawnInterval) {
        state.lastSpawnTime = now;
        spawnBeam();
      }
    }

    updateSail(dt);
    updateBeams(dt);
    render();

    // Проверка победы: все лучи заспавнены и ни одного не осталось
    if (state.running &&
        state.spawned >= state.config.totalBeams &&
        state.beams.length === 0 &&
        state.missed < state.config.maxMissed) {
      endGame(true);
      return;
    }

    state.rafId = requestAnimationFrame(loop);
  }

  // ---------- Управление игрой ----------
  function startGame(difficultyKey) {
    state.difficulty = difficultyKey;
    state.config = DIFFICULTY[difficultyKey];

    state.running = true;
    state.beams = [];
    state.caught = 0;
    state.missed = 0;
    state.spawned = 0;
    state.lastSpawnTime = performance.now();
    state.lastFrameTime = 0;

    // Парус в центр
    state.sail.x = W / 2;
    state.sail.y = H / 2;
    state.sail.r = Math.max(26, Math.min(40, Math.min(W, H) * 0.07));
    state.sail.angle = 0;

    // Указатель изначально в центре
    state.pointer.x = W / 2;
    state.pointer.y = H / 2;
    state.pointer.active = false;

    caughtEl.textContent = "0";
    missedEl.textContent = "0";

    menuScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");

    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(loop);
  }

  function endGame(win) {
    state.running = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    if (win) {
      resultTitle.textContent = "Победа!";
      resultText.textContent =
        "Сложность: " + state.config.label +
        ". Поймано лучей: " + state.caught +
        ". Пропущено: " + state.missed + ".";
    } else {
      resultTitle.textContent = "Игра окончена";
      resultText.textContent =
        "Слишком много пропущенных лучей (" + state.missed + "). " +
        "Поймано: " + state.caught + ".";
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

  // ---------- Обработчики кнопок ----------
  difficultyBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      startGame(btn.dataset.difficulty);
    });
  });

  restartBtn.addEventListener("click", function () {
    startGame(state.difficulty);
  });

  menuBtn.addEventListener("click", goToMenu);

  // ---------- Инициализация ----------
  resize();
  state.sail.x = W / 2;
  state.sail.y = H / 2;
  state.sail.r = Math.max(26, Math.min(40, Math.min(W, H) * 0.07));
})();
