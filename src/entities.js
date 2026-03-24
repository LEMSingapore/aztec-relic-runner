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
  const cx = skull.x + 10;
  const cy = skull.y + 8;

  // Rounded cranium
  ctx.fillStyle = '#eeeeff';
  ctx.beginPath();
  ctx.arc(cx, cy, 9, Math.PI, 0);
  ctx.fill();
  // Jaw (flat rectangle)
  ctx.fillRect(cx - 7, cy, 14, 7);

  // Cheekbone shade
  ctx.fillStyle = '#ccccee';
  ctx.fillRect(cx - 7, cy, 14, 2);

  // Glowing red eyes
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#ff2222';
  ctx.beginPath(); ctx.arc(cx - 4, cy - 1, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy - 1, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Nose cavity
  ctx.fillStyle = '#221122';
  ctx.beginPath(); ctx.arc(cx, cy + 3, 1.5, 0, Math.PI * 2); ctx.fill();

  // Teeth
  ctx.fillStyle = '#ddddee';
  for (let t = -4; t <= 4; t += 3) {
    ctx.fillRect(cx + t - 1, cy + 5, 2, 3);
  }
  ctx.fillStyle = '#221122';
  for (let t = -3; t <= 3; t += 3) {
    ctx.fillRect(cx + t, cy + 5, 1, 3);
  }
}

function drawSpider(ctx, spider) {
  const cx = spider.x + 7;
  const cy = spider.y + 6;

  // Legs with bent elbow joints (L-shaped), 4 per side
  ctx.strokeStyle = '#00cc33';
  ctx.lineWidth = 1;
  const legData = [
    // [shoulderX, shoulderY, elbowX, elbowY, tipX, tipY]  left side
    [cx - 3, cy - 2,  cx - 7, cy - 5,  cx - 12, cy - 2],
    [cx - 3, cy,      cx - 7, cy,      cx - 12, cy + 2],
    [cx - 3, cy + 2,  cx - 7, cy + 4,  cx - 12, cy + 6],
    [cx - 3, cy + 4,  cx - 7, cy + 7,  cx - 11, cy + 10],
    // right side
    [cx + 3, cy - 2,  cx + 7, cy - 5,  cx + 12, cy - 2],
    [cx + 3, cy,      cx + 7, cy,      cx + 12, cy + 2],
    [cx + 3, cy + 2,  cx + 7, cy + 4,  cx + 12, cy + 6],
    [cx + 3, cy + 4,  cx + 7, cy + 7,  cx + 11, cy + 10],
  ];
  for (const [sx, sy, ex, ey, tx, ty] of legData) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  // Body: dark oval
  ctx.fillStyle = '#007722';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Abdomen: bright green oval behind body
  ctx.fillStyle = '#00ee44';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#ff0000';
  ctx.beginPath(); ctx.arc(cx - 2, cy - 2, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 2, cy - 2, 1, 0, Math.PI * 2); ctx.fill();
}

function drawFirePit(ctx, fp) {
  // Orange glow base
  ctx.fillStyle = 'rgba(255,100,0,0.3)';
  ctx.fillRect(fp.x - 4, fp.y + 4, fp.width + 8, 10);

  // Pit base
  ctx.fillStyle = '#2a1500';
  ctx.fillRect(fp.x, fp.y + 8, fp.width, 6);
  ctx.fillStyle = '#555';
  ctx.fillRect(fp.x, fp.y + 8, fp.width, 2);

  // 5 animated flame tips
  const numFlames = 5;
  const colors = [['#ffee00','#ff8800','#ff4400'], ['#ff8800','#ff4400','#ffee00'], ['#ff4400','#ffee00','#ff8800']];
  const heights = [10, 12, 8, 11, 9];
  const offsets = [0, 1, -1, 1, 0];
  for (let i = 0; i < numFlames; i++) {
    const fx = fp.x + (fp.width / (numFlames + 1)) * (i + 1);
    const fh = heights[i] + ((fp.animFrame * 2) % 3) - 1;
    const fOff = offsets[(i + fp.animFrame) % 5] * 1.5;
    const colSet = colors[(i + fp.animFrame) % 3];
    // Outer flame
    ctx.fillStyle = colSet[0];
    ctx.beginPath();
    ctx.moveTo(fx - 3, fp.y + 9);
    ctx.lineTo(fx + 3, fp.y + 9);
    ctx.lineTo(fx + fOff, fp.y + 9 - fh);
    ctx.closePath();
    ctx.fill();
    // Inner brighter core
    ctx.fillStyle = colSet[1];
    ctx.beginPath();
    ctx.moveTo(fx - 1.5, fp.y + 9);
    ctx.lineTo(fx + 1.5, fp.y + 9);
    ctx.lineTo(fx + fOff * 0.5, fp.y + 9 - fh * 0.6);
    ctx.closePath();
    ctx.fill();
  }
}
