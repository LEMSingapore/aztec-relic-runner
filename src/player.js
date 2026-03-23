// player.js — Player entity: physics, controls, rendering

import { CONFIG } from './config.js';
import { rectsOverlap } from './trap.js';

const C = CONFIG.COL;
const T = CONFIG.TILE;

/** How long the player is invincible after taking a hit (seconds). */
const INV_DURATION = 0.8;

export class Player {
  /**
   * @param {number} x  Spawn x (top-left)
   * @param {number} y  Spawn y (top-left)
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = CONFIG.PLAYER_WIDTH;
    this.h = CONFIG.PLAYER_HEIGHT;

    this.vx = 0;
    this.vy = 0;

    /** 'idle' | 'run' | 'jump' | 'climb' | 'dead' */
    this.state = 'idle';

    this.health = CONFIG.PLAYER_MAX_HEALTH;
    this.onGround = false;
    this.onLadder = false;

    this._facingRight = true;
    this._invTimer = 0;   // seconds remaining of invincibility
    this._animT = 0;      // animation clock
  }

  // ── Public ──────────────────────────────────────────────────────────

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  get alive() {
    return this.health > 0;
  }

  /** Inflict damage; respects i-frames. */
  takeDamage(amount = 1) {
    if (this._invTimer > 0 || !this.alive) return;
    this.health = Math.max(0, this.health - amount);
    this._invTimer = INV_DURATION;
    if (this.health <= 0) this.state = 'dead';
  }

  /**
   * Main update — call once per frame.
   * @param {number}  dt    Delta time in seconds
   * @param {Object}  keys  Map of KeyboardEvent.code → boolean
   * @param {import('./room.js').Room} room  Current room
   */
  update(dt, keys, room) {
    if (this.state === 'dead') return;

    this._invTimer = Math.max(0, this._invTimer - dt);
    this._animT += dt;

    // ── Detect ladder overlap ─────────────────────────────────────────
    this.onLadder = false;
    for (const ladder of room.ladders) {
      if (rectsOverlap(this.bounds, ladder.bounds)) {
        this.onLadder = true;
        break;
      }
    }

    // ── Horizontal input ──────────────────────────────────────────────
    let moveX = 0;
    if (keys['ArrowLeft']  || keys['KeyA']) moveX -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) moveX += 1;
    if (moveX !== 0) this._facingRight = moveX > 0;
    this.vx = moveX * CONFIG.PLAYER_SPEED;

    // ── Ladder physics ────────────────────────────────────────────────
    if (this.onLadder) {
      this.vy = 0; // hang by default
      if (keys['ArrowUp']   || keys['KeyW']) this.vy = -CONFIG.CLIMB_SPEED;
      if (keys['ArrowDown'] || keys['KeyS']) this.vy =  CONFIG.CLIMB_SPEED;

      this.state = (this.vy !== 0) ? 'climb' : (moveX !== 0 ? 'run' : 'idle');

      this.x += this.vx * dt;
      this._clampX();
      this.y += this.vy * dt;
      this._resolveY(room, this.y - this.vy * dt);
      return;
    }

    // ── Ground physics ────────────────────────────────────────────────
    const wantsJump = keys['Space'] || keys['KeyK'] ||
                      keys['ArrowUp'] || keys['KeyW'];
    if (wantsJump && this.onGround) {
      this.vy = CONFIG.PLAYER_JUMP_VEL;
      this.onGround = false;
    }

    // Gravity
    this.vy = Math.min(this.vy + CONFIG.GRAVITY * dt, CONFIG.MAX_FALL_SPEED);

    // Move X → resolve
    const prevY = this.y;
    this.x += this.vx * dt;
    this._clampX();
    this._resolveX(room);

    // Move Y → resolve
    this.y += this.vy * dt;
    this._resolveY(room, prevY);

    // Update state
    if (!this.onGround) {
      this.state = 'jump';
    } else if (moveX !== 0) {
      this.state = 'run';
    } else {
      this.state = 'idle';
    }
  }

  draw(ctx) {
    // Flicker during invincibility
    if (this._invTimer > 0 && Math.floor(this._invTimer * 12) % 2 === 0) return;

    const { x, y, w, h } = this;

    // Body fill
    ctx.fillStyle = this.state === 'dead' ? '#888' : C.PLAYER;
    ctx.fillRect(x, y, w, h);

    // Inner body shading
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Face (eye + mouth)
    ctx.fillStyle = '#2a1800';
    if (this._facingRight) {
      ctx.fillRect(x + w * 0.55, y + h * 0.28, 3, 3); // eye
      const mw = this.state === 'jump' ? 3 : 5;
      ctx.fillRect(x + w * 0.55, y + h * 0.55, mw, 2); // mouth
    } else {
      ctx.fillRect(x + w * 0.3, y + h * 0.28, 3, 3);
      const mw = this.state === 'jump' ? 3 : 5;
      ctx.fillRect(x + w * 0.18, y + h * 0.55, mw, 2);
    }

    // Archaeologist hat (brim + crown)
    ctx.fillStyle = '#7a3810';
    ctx.fillRect(x - 2, y - 5, w + 4, 3);  // brim
    ctx.fillRect(x + 3, y - 11, w - 6, 7); // crown
    ctx.fillStyle = '#5a2808';
    ctx.fillRect(x + 3, y - 11, w - 6, 2); // hat band

    // Climb animation: arms out
    if (this.state === 'climb') {
      const armWave = Math.sin(this._animT * 8) * 3;
      ctx.fillStyle = C.PLAYER;
      ctx.fillRect(x - 6, y + 6 + armWave, 6, 4);
      ctx.fillRect(x + w, y + 6 - armWave, 6, 4);
    }

    // Run animation: leg bob
    if (this.state === 'run') {
      const leg = Math.sin(this._animT * 10) * 3;
      ctx.fillStyle = C.PLAYER;
      ctx.fillRect(x + 2, y + h, 5, 4 + leg);
      ctx.fillRect(x + w - 7, y + h, 5, 4 - leg);
    }
  }

  // ── Private ──────────────────────────────────────────────────────────

  _clampX() {
    this.x = Math.max(0, Math.min(CONFIG.ROOM_W - this.w, this.x));
  }

  /** Resolve horizontal collisions (only solid floor edges matter). */
  _resolveX(room) {
    // Only check the floor's left/right edges — floating platforms don't
    // act as walls. Room boundary clamping handles the rest.
    const fb = room.floor.bounds;
    if (rectsOverlap(this.bounds, fb)) {
      // If player is above the floor top, let _resolveY handle it
      if (this.y + this.h > fb.y + 2) {
        if (this.x + this.w / 2 < fb.x + fb.w / 2) {
          this.x = fb.x - this.w;
        } else {
          this.x = fb.x + fb.w;
        }
      }
    }
  }

  /**
   * Resolve vertical collisions.
   * @param {import('./room.js').Room} room
   * @param {number} prevY  Y position before this frame's vertical move
   */
  _resolveY(room, prevY) {
    this.onGround = false;
    const allSurfaces = [room.floor, ...room.platforms];

    for (const surf of allSurfaces) {
      const sb = surf.bounds;
      if (!rectsOverlap(this.bounds, sb)) continue;

      const prevBottom = prevY + this.h;
      const prevTop    = prevY;

      if (this.vy >= 0 && prevBottom <= sb.y + 4) {
        // Was at or above platform top → land on it
        this.y = sb.y - this.h;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy < 0 && prevTop >= sb.y + sb.h - 4) {
        // Was below ceiling → hit head
        this.y = sb.y + sb.h;
        this.vy = 0;
      }
    }

    // Hard clamp: don't escape bottom of room
    if (this.y + this.h > CONFIG.ROOM_H) {
      this.y = CONFIG.ROOM_H - this.h;
      this.vy = 0;
      this.onGround = true;
    }
  }
}
