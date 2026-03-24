/**
 * player.js — Player entity
 * Handles position, velocity, movement, AABB collision with room geometry,
 * ladder/chain climbing, jumping, and animation state.
 */

import { CONFIG } from './config.js';
import { input } from './input.js';

const C = CONFIG;
const W = C.INTERNAL_WIDTH;
const HUD = C.HUD_HEIGHT;

/** Animation states */
export const ANIM = {
  IDLE:    'idle',
  WALK:    'walk',
  JUMP:    'jump',
  CLIMB:   'climb',
  DEAD:    'dead',
};

/**
 * Create a fresh player object.
 * @param {number} x - Starting x (left edge)
 * @param {number} y - Starting y (top edge)
 */
export function createPlayer(x, y) {
  return {
    x, y,
    vx: 0,
    vy: 0,
    width:  C.PLAYER_WIDTH,
    height: C.PLAYER_HEIGHT,
    onGround:  false,
    onLadder:  false,
    onChain:   false,
    facingRight: true,
    anim: ANIM.IDLE,
    animFrame: 0,
    animTimer: 0,
    dead: false,
    deathTimer: 0,
  };
}

/**
 * Update player for one frame.
 * @param {object} player
 * @param {object} room   - current room (platforms, ladders, chains, doors)
 */
export function updatePlayer(player, room) {
  if (player.dead) {
    player.deathTimer++;
    return;
  }

  const onClimbable = _checkClimbable(player, room);

  // ── Horizontal movement ──────────────────────────────────────────────────
  if (!player.onLadder && !player.onChain) {
    if (input.left) {
      player.vx = -C.PLAYER_SPEED;
      player.facingRight = false;
    } else if (input.right) {
      player.vx = C.PLAYER_SPEED;
      player.facingRight = true;
    } else {
      player.vx = 0;
    }
  } else {
    // While climbing, allow slight horizontal nudge to dismount
    player.vx = 0;
  }

  // ── Jumping ──────────────────────────────────────────────────────────────
  if (input.jumpPressed && player.onGround && !player.onLadder && !player.onChain) {
    player.vy = C.JUMP_VELOCITY;
    player.onGround = false;
  }

  // ── Climb / descend ladders & chains ─────────────────────────────────────
  if (onClimbable) {
    if (input.up) {
      player.vy = -C.CLIMB_SPEED;
      player.onLadder = true;
      player.onChain  = true;
    } else if (input.down) {
      player.vy = C.CLIMB_SPEED;
      player.onLadder = true;
      player.onChain  = true;
    } else if (player.onLadder || player.onChain) {
      player.vy = 0;
    }
  } else {
    player.onLadder = false;
    player.onChain  = false;
  }

  // ── Gravity (skip when on climbable) ─────────────────────────────────────
  if (!player.onLadder && !player.onChain) {
    player.vy += C.GRAVITY;
    if (player.vy > C.MAX_FALL_SPEED) player.vy = C.MAX_FALL_SPEED;
  }

  // ── Move & collide ───────────────────────────────────────────────────────
  player.x += player.vx;
  _collideX(player, room);

  player.y += player.vy;
  _collideY(player, room);

  // ── Clamp to screen horizontal bounds ───────────────────────────────────
  if (player.x < 8) player.x = 8;
  if (player.x + player.width > W - 8) player.x = W - 8 - player.width;

  // ── Animation state ──────────────────────────────────────────────────────
  _updateAnim(player);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _checkClimbable(player, room) {
  const px = player.x + player.width / 2;
  const py = player.y + player.height / 2;

  for (const ladder of room.ladders) {
    if (px >= ladder.x - 4 && px <= ladder.x + 12 &&
        py >= ladder.y && py <= ladder.y + ladder.h) {
      return true;
    }
  }
  for (const chain of room.chains) {
    if (px >= chain.x - 4 && px <= chain.x + 8 &&
        py >= chain.y && py <= chain.y + chain.h) {
      return true;
    }
  }
  return false;
}

/** Resolve horizontal AABB collision against all platforms */
function _collideX(player, room) {
  for (const plat of room.platforms) {
    if (_overlaps(player, plat)) {
      if (player.vx > 0) {
        player.x = plat.x - player.width;
      } else if (player.vx < 0) {
        player.x = plat.x + plat.w;
      }
      player.vx = 0;
    }
  }
}

/** Resolve vertical AABB collision against all platforms */
function _collideY(player, room) {
  player.onGround = false;
  for (const plat of room.platforms) {
    if (_overlaps(player, plat)) {
      if (player.vy > 0) {
        // Landing on top
        player.y = plat.y - player.height;
        player.onGround = true;
      } else if (player.vy < 0) {
        // Hitting ceiling
        player.y = plat.y + plat.h;
      }
      player.vy = 0;
    }
  }
}

/** AABB overlap test between player and a platform rect {x,y,w,h} */
function _overlaps(player, rect) {
  return player.x < rect.x + rect.w &&
         player.x + player.width > rect.x &&
         player.y < rect.y + rect.h &&
         player.y + player.height > rect.y;
}

function _updateAnim(player) {
  if (player.onLadder || player.onChain) {
    player.anim = ANIM.CLIMB;
  } else if (!player.onGround) {
    player.anim = ANIM.JUMP;
  } else if (player.vx !== 0) {
    player.anim = ANIM.WALK;
  } else {
    player.anim = ANIM.IDLE;
  }

  player.animTimer++;
  if (player.animTimer >= 8) {
    player.animTimer = 0;
    player.animFrame = (player.animFrame + 1) % 4;
  }
}

// ─── Drawing ─────────────────────────────────────────────────────────────────

/**
 * Draw the player onto ctx.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} player
 */
export function drawPlayer(ctx, player) {
  const { x, y, width, height, facingRight, anim, animFrame, dead, deathTimer } = player;
  const C2 = CONFIG.COLORS;

  if (dead) {
    // Flashing death animation
    if (Math.floor(deathTimer / 4) % 2 === 0) return;
  }

  ctx.save();

  if (!facingRight) {
    // Flip horizontally
    ctx.translate(x + width / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + width / 2), 0);
  }

  // Body
  ctx.fillStyle = C2.PLAYER;
  ctx.fillRect(x + 2, y + 8, width - 4, height - 8);

  // Head
  ctx.fillStyle = '#ffcc88';
  ctx.fillRect(x + 3, y, width - 6, 9);

  // Eyes
  ctx.fillStyle = '#222';
  ctx.fillRect(x + width - 7, y + 2, 2, 2);

  // Legs (animated walk)
  ctx.fillStyle = '#cc6600';
  if (anim === ANIM.WALK) {
    const legOff = (animFrame % 2 === 0) ? 2 : -2;
    ctx.fillRect(x + 2, y + height - 6, 4, 6 + legOff);
    ctx.fillRect(x + width - 6, y + height - 6, 4, 6 - legOff);
  } else {
    ctx.fillRect(x + 2, y + height - 6, 4, 6);
    ctx.fillRect(x + width - 6, y + height - 6, 4, 6);
  }

  // Arms (climbing)
  if (anim === ANIM.CLIMB) {
    ctx.fillStyle = C2.PLAYER;
    const armOff = (animFrame % 2 === 0) ? -2 : 2;
    ctx.fillRect(x - 3, y + 8 + armOff, 5, 4);
    ctx.fillRect(x + width - 2, y + 8 - armOff, 5, 4);
  }

  ctx.restore();
}
