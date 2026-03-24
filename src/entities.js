/**
 * entities.js — Enemies and hazards
 * Skull enemies bounce left/right on platforms.
 * Spider enemies patrol vertically on chains/ladders.
 * Fire pits are static hazards.
 */

import { CONFIG } from './config.js';

export const ENTITY_TYPES = {
  SKULL:    'skull',
  SPIDER:   'spider',
  FIRE_PIT: 'fire_pit',
};

// ─── Factory functions ────────────────────────────────────────────────────────

/**
 * Create a skull enemy that bounces horizontally on a platform.
 * @param {number} x - Starting x pixel position
 * @param {number} y - Starting y pixel position
 * @param {number} patrolLeft  - Left bound x
 * @param {number} patrolRight - Right bound x
 */
export function createSkull(x, y, patrolLeft, patrolRight) {
  return {
    type: ENTITY_TYPES.SKULL,
    x, y,
    width: 16, height: 14,
    vx: CONFIG.SKULL_SPEED,
    vy: 0,
    patrolLeft,
    patrolRight,
    dead: false,
    bounceTimer: 0,
  };
}

/**
 * Create a spider enemy that moves vertically.
 * @param {number} x - x pixel position (stays constant)
 * @param {number} y - Starting y pixel position
 * @param {number} patrolTop    - Upper bound y
 * @param {number} patrolBottom - Lower bound y
 */
export function createSpider(x, y, patrolTop, patrolBottom) {
  return {
    type: ENTITY_TYPES.SPIDER,
    x, y,
    width: 14, height: 12,
    vx: 0,
    vy: CONFIG.SPIDER_SPEED,
    patrolTop,
    patrolBottom,
    dead: false,
  };
}

/**
 * Create a static fire pit hazard.
 * @param {number} x - x pixel position
 * @param {number} y - y pixel position
 * @param {number} w - width
 */
export function createFirePit(x, y, w) {
  return {
    type: ENTITY_TYPES.FIRE_PIT,
    x, y,
    width: w, height: 12,
    animFrame: 0,
    animTimer: 0,
  };
}

// ─── Update logic ─────────────────────────────────────────────────────────────

/**
 * Update all entities in the given array for one frame.
 * @param {Array} entities
 */
export function updateEntities(entities) {
  for (const e of entities) {
    if (e.type === ENTITY_TYPES.SKULL) {
      updateSkull(e);
    } else if (e.type === ENTITY_TYPES.SPIDER) {
      updateSpider(e);
    } else if (e.type === ENTITY_TYPES.FIRE_PIT) {
      updateFirePit(e);
    }
  }
}

function updateSkull(skull) {
  skull.x += skull.vx;
  // Bounce patrol
  if (skull.x <= skull.patrolLeft) {
    skull.x = skull.patrolLeft;
    skull.vx = Math.abs(skull.vx);
  } else if (skull.x + skull.width >= skull.patrolRight) {
    skull.x = skull.patrolRight - skull.width;
    skull.vx = -Math.abs(skull.vx);
  }
  // Add slight vertical bobbing
  skull.bounceTimer++;
  skull.y = skull.y + 0; // patched each frame by gravity if needed
}

function updateSpider(spider) {
  spider.y += spider.vy;
  if (spider.y <= spider.patrolTop) {
    spider.y = spider.patrolTop;
    spider.vy = Math.abs(spider.vy);
  } else if (spider.y + spider.height >= spider.patrolBottom) {
    spider.y = spider.patrolBottom - spider.height;
    spider.vy = -Math.abs(spider.vy);
  }
}

function updateFirePit(fp) {
  fp.animTimer++;
  if (fp.animTimer >= 8) {
    fp.animTimer = 0;
    fp.animFrame = (fp.animFrame + 1) % 3;
  }
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

/**
 * Draw all entities onto ctx.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} entities
 */
export function drawEntities(ctx, entities) {
  for (const e of entities) {
    if (e.type === ENTITY_TYPES.SKULL) {
      drawSkull(ctx, e);
    } else if (e.type === ENTITY_TYPES.SPIDER) {
      drawSpider(ctx, e);
    } else if (e.type === ENTITY_TYPES.FIRE_PIT) {
      drawFirePit(ctx, e);
    }
  }
}

function drawSkull(ctx, skull) {
  const C = CONFIG.COLORS;
  // White skull circle
  ctx.fillStyle = C.SKULL;
  ctx.beginPath();
  ctx.arc(skull.x + skull.width / 2, skull.y + skull.height / 2 - 1, 7, 0, Math.PI * 2);
  ctx.fill();
  // Eye sockets
  ctx.fillStyle = C.BG;
  ctx.fillRect(skull.x + 3, skull.y + 4, 3, 3);
  ctx.fillRect(skull.x + 10, skull.y + 4, 3, 3);
  // Teeth
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(skull.x + 4, skull.y + 11, 2, 2);
  ctx.fillRect(skull.x + 8, skull.y + 11, 2, 2);
  ctx.fillRect(skull.x + 12, skull.y + 11, 2, 2);
}

function drawSpider(ctx, spider) {
  const C = CONFIG.COLORS;
  ctx.fillStyle = C.SPIDER;
  // Body
  ctx.beginPath();
  ctx.arc(spider.x + 7, spider.y + 6, 5, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.strokeStyle = C.SPIDER;
  ctx.lineWidth = 1;
  // Left legs
  ctx.beginPath(); ctx.moveTo(spider.x + 3, spider.y + 4); ctx.lineTo(spider.x - 3, spider.y + 1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(spider.x + 3, spider.y + 6); ctx.lineTo(spider.x - 3, spider.y + 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(spider.x + 3, spider.y + 8); ctx.lineTo(spider.x - 3, spider.y + 11); ctx.stroke();
  // Right legs
  ctx.beginPath(); ctx.moveTo(spider.x + 11, spider.y + 4); ctx.lineTo(spider.x + 17, spider.y + 1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(spider.x + 11, spider.y + 6); ctx.lineTo(spider.x + 17, spider.y + 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(spider.x + 11, spider.y + 8); ctx.lineTo(spider.x + 17, spider.y + 11); ctx.stroke();
}

function drawFirePit(ctx, fp) {
  const C = CONFIG.COLORS;
  // Base
  ctx.fillStyle = '#333';
  ctx.fillRect(fp.x, fp.y + 6, fp.width, 6);
  // Flames (animated)
  const colors = ['#ff4400', '#ff8800', '#ffcc00'];
  const offsets = [0, 1, -1];
  for (let i = 0; i < 3; i++) {
    const fx = fp.x + (fp.width / 4) * (i + 0.5);
    const fOff = offsets[(i + fp.animFrame) % 3];
    ctx.fillStyle = colors[i % 3];
    ctx.beginPath();
    ctx.moveTo(fx - 3, fp.y + 6);
    ctx.lineTo(fx + 3, fp.y + 6);
    ctx.lineTo(fx + fOff, fp.y);
    ctx.closePath();
    ctx.fill();
  }
}
