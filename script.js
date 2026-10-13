* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #05070f;
  font-family: "Segoe UI", Roboto, Arial, sans-serif;
  color: #eaf2ff;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

#game-wrap {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  touch-action: none;
}

#game-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  background: #05070f;
}

/* ---------- HUD ---------- */
#hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding: calc(10px + env(safe-area-inset-top)) 14px 10px;
  pointer-events: none;
  z-index: 5;
}

.hud-item {
  display: flex;
  flex-direction: column;
  background: rgba(10, 20, 40, 0.55);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(120, 190, 255, 0.35);
  border-radius: 10px;
  padding: 6px 12px;
  min-width: 110px;
  text-align: center;
}

.hud-label {
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #8fb8e8;
}

.hud-value {
  font-size: 16px;
  font-weight: 700;
  color: #ffe27a;
  font-variant-numeric: tabular-nums;
}

/* Полоска батареи */
.battery {
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
  margin: 5px 0 3px;
}

.battery-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #ff5f5f, #ffd76a, #8affa1);
  background-size: 300% 100%;
  background-position: 50% 0;
  transition: width 0.15s linear;
}

/* ---------- Прогресс-бар полёта ---------- */
#progress-bar {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: calc(14px + env(safe-area-inset-bottom));
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  overflow: visible;
  z-index: 5;
  pointer-events: none;
}

#progress-fill {
  height: 100%;
  width: 0%;
  border-radius: 3px;
  background: linear-gradient(90deg, #6ab7ff, #ffe27a);
  box-shadow: 0 0 12px rgba(255, 210, 90, 0.6);
  transition: width 0.2s linear;
}

.progress-label {
  position: absolute;
  top: -18px;
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #8fb8e8;
}

.progress-label-start { left: 0; }
.progress-label-end   { right: 0; color: #ffb27a; }

/* ---------- Оверлеи ---------- */
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(circle at 50% 40%, rgba(30, 60, 120, 0.85), rgba(3, 6, 15, 0.95));
  z-index: 10;
  text-align: center;
  opacity: 1;
  transition: opacity 0.25s ease;
}

.overlay.hidden {
  display: flex;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.25s ease, visibility 0s 0.25s;
}

.title {
  font-size: clamp(28px, 7vw, 48px);
  font-weight: 800;
  letter-spacing: 1px;
  color: #ffe27a;
  text-shadow: 0 0 24px rgba(255, 210, 90, 0.6);
  margin-bottom: 10px;
}

.subtitle {
  font-size: clamp(14px, 3.6vw, 18px);
  color: #cfe1ff;
  max-width: 480px;
  margin-bottom: 22px;
  line-height: 1.45;
}

.difficulty-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(320px, 90vw);
}

.btn {
  appearance: none;
  border: 1px solid rgba(140, 200, 255, 0.5);
  background: linear-gradient(180deg, #2a4a80, #16283f);
  color: #eaf2ff;
  font-size: clamp(15px, 4vw, 18px);
  font-weight: 600;
  padding: 14px 22px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.15s ease, background 0.15s ease;
  touch-action: manipulation;
}

@media (hover: hover) {
  .btn:hover {
    background: linear-gradient(180deg, #35619f, #1c3450);
    box-shadow: 0 0 18px rgba(120, 190, 255, 0.45);
  }
}

.btn:focus-visible {
  outline: 2px solid #ffe27a;
  outline-offset: 3px;
}

.btn:active {
  transform: scale(0.97);
}

.btn-secondary {
  background: linear-gradient(180deg, #3a3a4a, #1e1e2a);
  border-color: rgba(180, 180, 200, 0.4);
  margin-top: 10px;
}

@media (hover: hover) {
  .btn-secondary:hover {
    background: linear-gradient(180deg, #4a4a60, #262634);
    box-shadow: 0 0 14px rgba(180, 180, 200, 0.35);
  }
}

.hint {
  margin-top: 24px;
  font-size: clamp(12px, 3vw, 14px);
  color: #7fa3d1;
}

@media (prefers-reduced-motion: reduce) {
  .btn, .overlay, #progress-fill, .battery-fill { transition: none; }
}
