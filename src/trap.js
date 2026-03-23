// trap.js — spike traps and hazard objects

import { CONFIG } from './config.js';

/**
 * Spike trap — sits on a surface and damages on contact.
 */
export class Spike {
  /**
   * @param {number} x  left edge
   * @param {number} y  top edge (spikes point upward)
   * @param {number} [w] optional width override
   */
  constructor(x, y, w) {
    this.x = x;
    this.y = y;
    this.w = w ?? CONFIG.SPIKE_WIDTH;
    this.h = CONFIG.SPIKE_HEIGHT;
    this.damage = CONFIG.SPIKE_DAMAGE;
  }

  /** Axis-aligned bounding box */
  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw(ctx) {
    const { x, y, w, h } = this;
    ctx.fillStyle = CONFIG.COL.SPIKE;
    // draw triangle teeth
    const teeth = Math.max(1, Math.floor(w / 8));
    const tw = w / teeth;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const lx = x + i * tw;
      ctx.moveTo(lx, y + h);
      ctx.lineTo(lx + tw / 2, y);
      ctx.lineTo(lx + tw, y + h);
    }
    ctx.closePath();
    ctx.fill();
  }
}

/** Check AABB overlap between two rect-like objects {x,y,w,h} */
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
