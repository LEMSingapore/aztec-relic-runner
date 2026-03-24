/**
 * main.js — Entry point / bootstrap
 * Sets up the canvas, scales it to the display, wires up the main game loop.
 */

import { CONFIG } from './config.js';
import { Game } from './game.js';
import { input } from './input.js';

const IW = CONFIG.INTERNAL_WIDTH;
const IH = CONFIG.INTERNAL_HEIGHT;
const SCALE = CONFIG.DISPLAY_SCALE;

// ─── Canvas setup ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('game-canvas');
canvas.width  = IW;
canvas.height = IH;
canvas.style.width  = `${IW * SCALE}px`;
canvas.style.height = `${IH * SCALE}px`;
canvas.style.imageRendering = 'pixelated';

const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ─── Game instance ────────────────────────────────────────────────────────────

const game = new Game();

// ─── Main loop ────────────────────────────────────────────────────────────────

let lastTime = 0;
const TARGET_FPS = 60;
const FRAME_MS   = 1000 / TARGET_FPS;

function loop(timestamp) {
  const elapsed = timestamp - lastTime;

  if (elapsed >= FRAME_MS) {
    lastTime = timestamp - (elapsed % FRAME_MS);

    // Clear
    ctx.clearRect(0, 0, IW, IH);

    // Update game logic
    game.update();

    // Render
    game.draw(ctx);

    // Flush per-frame input state
    input.flush();
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
