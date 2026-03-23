// enemy.js — patrolling snake enemy

import { CONFIG } from './config.js';

const C = CONFIG.COL;

export class Snake {
  /**
   * @param {number} x      spawn x
   * @param {number} y      spawn y (top of snake, i.e. platform surface - height)
   * @param {number} minX   left patrol boundary
   * @param {number} maxX   right patrol boundary
   */
  constructor(x, y, minX, maxX) {
    this.x = x;
    this.y = y;
    this.w = CONFIG.SNAKE_WIDTH;
    this.h = CONFIG.SNAKE_HEIGHT;
    this.minX = minX;
    this.maxX = maxX;
    this.vx = CONFIG.SNAKE_SPEED; // starts moving right
    this.alive = true;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt) {
    if (!this.alive) return;
    this.x += this.vx * dt;
    if (this.x <= this.minX) {
      this.x = this.minX;
      this.vx = CONFIG.SNAKE_SPEED;
    }
    if (this.x + this.w >= this.maxX) {
      this.x = this.maxX - this.w;
      this.vx = -CONFIG.SNAKE_SPEED;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    const { x, y, w, h } = this;
    const facingRight = this.vx >= 0;

    // body
    ctx.fillStyle = C.SNAKE;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // head bump
    const hx = facingRight ? x + w - 4 : x + 4;
    ctx.fillStyle = '#258c25';
    ctx.beginPath();
    ctx.ellipse(hx, y + h / 2, 7, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // eye
    ctx.fillStyle = '#ff0';
    const ex = facingRight ? x + w - 2 : x + 2;
    ctx.beginPath();
    ctx.arc(ex, y + h / 2 - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // tongue
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const tx = facingRight ? x + w + 2 : x - 2;
    const ty = y + h / 2;
    ctx.moveTo(tx, ty);
    const forked = facingRight ? 1 : -1;
    ctx.lineTo(tx + forked * 6, ty - 3);
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + forked * 6, ty + 3);
    ctx.stroke();
  }
}
