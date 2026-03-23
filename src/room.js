// room.js — Room layout: platforms, ladders, doors, items, enemies, traps

import { CONFIG } from './config.js';
import { Spike } from './trap.js';
import { Snake } from './enemy.js';

const C = CONFIG.COL;
const T = CONFIG.TILE;
const RW = CONFIG.ROOM_W;
const RH = CONFIG.ROOM_H;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}
function chance(p) {
  return Math.random() < p;
}

// ──────────────────────────────────────────────
// Door
// ──────────────────────────────────────────────

/**
 * A door connecting to an adjacent room.
 * side: 'left' | 'right' | 'up' | 'down'
 */
export class Door {
  constructor(side, toRoomId, isExit = false) {
    this.side = side;
    this.toRoomId = toRoomId;
    this.isExit = isExit;
    this._buildGeometry();
  }

  _buildGeometry() {
    const dw = T * 1.5; // door width
    const dh = T * 2;   // door height
    switch (this.side) {
      case 'left':
        this.x = 0; this.y = RH - T - dh;
        this.w = T * 0.6; this.h = dh;
        break;
      case 'right':
        this.x = RW - T * 0.6; this.y = RH - T - dh;
        this.w = T * 0.6; this.h = dh;
        break;
      case 'up':
        this.x = RW / 2 - dw / 2; this.y = 0;
        this.w = dw; this.h = T * 0.6;
        break;
      case 'down':
        this.x = RW / 2 - dw / 2; this.y = RH - T * 0.6;
        this.w = dw; this.h = T * 0.6;
        break;
    }
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw(ctx) {
    ctx.fillStyle = this.isExit ? C.EXIT_DOOR : C.DOOR;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // outline
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    // label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = this.isExit ? 'EXIT' : '→';
    ctx.fillText(label, this.x + this.w / 2, this.y + this.h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

// ──────────────────────────────────────────────
// Platform
// ──────────────────────────────────────────────

export class Platform {
  constructor(x, y, w, h = T / 2) {
    this.x = x; this.y = y; this.w = w; this.h = h;
  }
  get bounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  draw(ctx) {
    ctx.fillStyle = C.PLATFORM;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // top highlight
    ctx.fillStyle = '#a07840';
    ctx.fillRect(this.x, this.y, this.w, 3);
  }
}

// ──────────────────────────────────────────────
// Ladder
// ──────────────────────────────────────────────

export class Ladder {
  constructor(x, y, h) {
    this.x = x; this.y = y;
    this.w = T * 0.75; this.h = h;
  }
  get bounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  draw(ctx) {
    const { x, y, w, h } = this;
    ctx.strokeStyle = C.LADDER;
    ctx.lineWidth = 3;

    // rails
    ctx.beginPath();
    ctx.moveTo(x + 4, y); ctx.lineTo(x + 4, y + h);
    ctx.moveTo(x + w - 4, y); ctx.lineTo(x + w - 4, y + h);
    ctx.stroke();

    // rungs
    ctx.lineWidth = 2;
    const rungSpacing = 12;
    for (let ry = y + 6; ry < y + h; ry += rungSpacing) {
      ctx.beginPath();
      ctx.moveTo(x + 4, ry); ctx.lineTo(x + w - 4, ry);
      ctx.stroke();
    }
  }
}

// ──────────────────────────────────────────────
// Treasure / Idol collectibles
// ──────────────────────────────────────────────

export class Collectible {
  /**
   * type: 'treasure' | 'idol'
   */
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.w = type === 'idol' ? 20 : 12;
    this.h = type === 'idol' ? 20 : 12;
    this.type = type;
    this.collected = false;
    this._t = 0; // for bob animation
  }

  get bounds() {
    return { x: this.x, y: this.y - 4, w: this.w, h: this.h };
  }

  update(dt) { this._t += dt; }

  draw(ctx) {
    if (this.collected) return;
    const bob = Math.sin(this._t * 3) * 3;
    const { x, y, w, h } = this;
    const drawY = y + bob;

    if (this.type === 'idol') {
      // Golden idol — idol head shape
      ctx.fillStyle = C.IDOL;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, drawY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cc7700';
      ctx.font = 'bold 11px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☆', x + w / 2, drawY + h / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      // glow
      ctx.shadowColor = '#ff9900';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, drawY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Coin / gem
      ctx.fillStyle = C.TREASURE;
      ctx.beginPath();
      ctx.arc(x + w / 2, drawY + h / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cc9900';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', x + w / 2, drawY + h / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }
}

// ──────────────────────────────────────────────
// Room
// ──────────────────────────────────────────────

export class Room {
  /**
   * @param {number} id
   * @param {boolean} isStart
   * @param {boolean} isIdolRoom
   * @param {boolean} isExitRoom
   */
  constructor(id, isStart = false, isIdolRoom = false, isExitRoom = false) {
    this.id = id;
    this.isStart = isStart;
    this.isIdolRoom = isIdolRoom;
    this.isExitRoom = isExitRoom;

    /** @type {Platform[]} */
    this.platforms = [];
    /** @type {Ladder[]} */
    this.ladders = [];
    /** @type {Spike[]} */
    this.spikes = [];
    /** @type {Snake[]} */
    this.enemies = [];
    /** @type {Collectible[]} */
    this.collectibles = [];
    /** @type {Door[]} */
    this.doors = [];

    // Floor as a platform
    this.floor = new Platform(0, RH - T, RW, T);

    this._generate();
  }

  _generate() {
    const floorY = RH - T; // top of floor
    const td = CONFIG.TRAP_DENSITY;
    const ed = CONFIG.ENEMY_DENSITY;

    // ── Platforms (2-4 floating shelves) ──
    const numPlatforms = randInt(2, 4);
    const usedXRanges = [];

    for (let i = 0; i < numPlatforms; i++) {
      const pw = randInt(T * 3, T * 6);
      const px = randInt(T, RW - pw - T);
      // stagger vertically across 3 rows
      const row = i % 3;
      const py = floorY - T * 2 - row * (T * 2 + randInt(0, T));
      if (py < T * 3) continue; // don't go off top
      const plat = new Platform(px, py, pw);
      this.platforms.push(plat);
      usedXRanges.push({ x: px, w: pw, y: py });
    }

    // ── Ladders ──
    // One connecting floor to first platform, and maybe between platforms
    for (const plat of this.platforms) {
      // ladder from this platform down to floor (or next lower platform)
      const lx = plat.x + plat.w / 2 - T * 0.375;
      const ly = plat.y + plat.h; // bottom of platform
      const lh = floorY - ly;
      if (lh > T) {
        this.ladders.push(new Ladder(lx, ly, lh));
      }
    }

    // ── Spikes on floor ──
    const spikeSections = randInt(1, 3);
    for (let i = 0; i < spikeSections; i++) {
      if (!chance(td + 0.2)) continue;
      const sw = randInt(T, T * 3);
      const sx = randInt(T * 2, RW - sw - T * 2);
      // avoid door zones (left/right edges)
      if (sx < T * 2.5 || sx + sw > RW - T * 2.5) continue;
      const sy = floorY - CONFIG.SPIKE_HEIGHT;
      this.spikes.push(new Spike(sx, sy, sw));
    }

    // ── Spikes on platform tops ──
    for (const plat of this.platforms) {
      if (chance(td)) {
        const sw = Math.min(randInt(T, T * 2), plat.w - T);
        if (sw <= 0) continue;
        const sx = plat.x + randInt(0, plat.w - sw);
        const sy = plat.y - CONFIG.SPIKE_HEIGHT;
        this.spikes.push(new Spike(sx, sy, sw));
      }
    }

    // ── Enemies ──
    if (chance(ed) && !this.isStart) {
      // one snake on floor (avoid spike zones)
      const sx = randInt(T * 2, RW - T * 4);
      const sy = floorY - CONFIG.SNAKE_HEIGHT;
      const minX = T;
      const maxX = RW - T;
      this.enemies.push(new Snake(sx, sy, minX, maxX));
    }
    for (const plat of this.platforms) {
      if (chance(ed * 0.5) && plat.w >= T * 3) {
        const sx = plat.x + 4;
        const sy = plat.y - CONFIG.SNAKE_HEIGHT;
        this.enemies.push(new Snake(sx, sy, plat.x, plat.x + plat.w));
      }
    }

    // ── Treasures ──
    const numTreasures = randInt(1, 3);
    for (let i = 0; i < numTreasures; i++) {
      const tx = randInt(T, RW - T * 2);
      const ty = floorY - T; // sit on floor
      this.collectibles.push(new Collectible(tx, ty, 'treasure'));
    }
    // Treasure on platforms
    for (const plat of this.platforms) {
      if (chance(0.5)) {
        const tx = plat.x + plat.w / 2 - 6;
        const ty = plat.y - 12;
        this.collectibles.push(new Collectible(tx, ty, 'treasure'));
      }
    }

    // ── Idol (only if idol room) ──
    if (this.isIdolRoom) {
      // centre of room, elevated
      const tx = RW / 2 - 10;
      const ty = floorY - T;
      this.collectibles.push(new Collectible(tx, ty, 'idol'));
    }
  }

  /** Add a door to this room */
  addDoor(side, toRoomId, isExit = false) {
    this.doors.push(new Door(side, toRoomId, isExit));
  }

  /** Player spawn position for this room */
  get spawnPos() {
    return { x: T * 2, y: RH - T - CONFIG.PLAYER_HEIGHT };
  }

  update(dt) {
    for (const e of this.enemies) e.update(dt);
    for (const c of this.collectibles) c.update(dt);
  }

  draw(ctx) {
    // BG
    ctx.fillStyle = C.BG;
    ctx.fillRect(0, 0, RW, RH);

    // Decorative stone lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < RW; gx += T) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, RH); ctx.stroke();
    }
    for (let gy = 0; gy < RH; gy += T) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(RW, gy); ctx.stroke();
    }

    // Floor
    this.floor.draw(ctx);

    // Platforms
    for (const p of this.platforms) p.draw(ctx);

    // Ladders
    for (const l of this.ladders) l.draw(ctx);

    // Collectibles
    for (const c of this.collectibles) c.draw(ctx);

    // Traps
    for (const s of this.spikes) s.draw(ctx);

    // Enemies
    for (const e of this.enemies) e.draw(ctx);

    // Doors
    for (const d of this.doors) d.draw(ctx);

    // Room ID (subtle debug)
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '10px monospace';
    ctx.fillText(`Room ${this.id}${this.isIdolRoom ? ' [IDOL]' : ''}${this.isExitRoom ? ' [EXIT]' : ''}`, 6, 14);
  }
}
