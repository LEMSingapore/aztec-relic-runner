// main.js — Entry point: bootstraps the Game and drives the animation loop.

import { Game } from './game.js';
import { CONFIG } from './config.js';

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('gameCanvas');
canvas.width  = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

const game = new Game(canvas);

let lastTime = 0;

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = timestamp;

  game.update(dt);
  game.draw();

  requestAnimationFrame(loop);
}

// Kick off
requestAnimationFrame(ts => {
  lastTime = ts;
  requestAnimationFrame(loop);
});
