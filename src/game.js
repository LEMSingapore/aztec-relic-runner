// game.js — Top-level Game class: state, update, draw, HUD, overlays

import { CONFIG } from './config.js';
import { World }  from './world.js';
import { Player } from './player.js';
import { rectsOverlap } from './trap.js';

const C  = CONFIG.COL;
const RW = CONFIG.ROOM_W;
const RH = CONFIG.ROOM_H;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    /** @type {Map<string,boolean>} live keyboard state */
    this._keys = new Map();

    /** track keys that were "just pressed" this frame */
    this._keysDown = new Set();

    this._bindInput();
    this._init();
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  /** (Re)initialise all game state. */
  _init() {
    this.world       = new World();
    this.currentRoom = this.world.startRoom;

    const sp = this.currentRoom.spawnPos;
    this.player = new Player(sp.x, sp.y);

    this.score    = 0;
    this.hasIdol  = false;
    this.gameOver = false;
    this.victory  = false;

    // Damage cooldown per-room (prevent frame-spam)
    this._spikeDmgCd  = 0;
    this._enemyDmgCd  = 0;

    // Transition flash
    this._flashTimer = 0;
  }

  /** Main update — called every frame with delta time (seconds). */
  update(dt) {
    if (this.gameOver || this.victory) {
      // R → restart
      if (this._keysDown.has('KeyR')) this._init();
      this._keysDown.clear();
      return;
    }

    const room   = this.currentRoom;
    const player = this.player;

    // Room update (enemies, collectible bobs)
    room.update(dt);

    // Player update
    player.update(dt, this._keys, room);

    // Flash timer
    if (this._flashTimer > 0) this._flashTimer -= dt;

    // Cooldowns
    this._spikeDmgCd  = Math.max(0, this._spikeDmgCd  - dt);
    this._enemyDmgCd  = Math.max(0, this._enemyDmgCd  - dt);

    if (player.state !== 'dead') {
      this._checkCollectibles(room);
      this._checkSpikes(room);
      this._checkEnemies(room);
      this._checkDoors(room);
    }

    // Death check
    if (!player.alive) {
      player.state = 'dead';
      this.gameOver = true;
    }

    this._keysDown.clear();
  }

  /** Draw everything. */
  draw() {
    const ctx = this.ctx;
    const room = this.currentRoom;

    // Room
    room.draw(ctx);

    // Transition flash overlay
    if (this._flashTimer > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this._flashTimer * 0.9})`;
      ctx.fillRect(0, 0, RW, RH);
    }

    // Player
    this.player.draw(ctx);

    // HUD
    this._drawHUD(ctx);

    // Overlays
    if (this.victory) this._drawOverlay(ctx, true);
    else if (this.gameOver) this._drawOverlay(ctx, false);
  }

  // ── Input ────────────────────────────────────────────────────────────

  _bindInput() {
    window.addEventListener('keydown', e => {
      this._keys.set(e.code, true);
      this._keysDown.add(e.code);
      // prevent arrow scroll
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      this._keys.set(e.code, false);
    });
  }

  // ── Collision helpers ────────────────────────────────────────────────

  _checkCollectibles(room) {
    const pb = this.player.bounds;
    for (const col of room.collectibles) {
      if (col.collected) continue;
      if (!rectsOverlap(pb, col.bounds)) continue;
      col.collected = true;
      if (col.type === 'idol') {
        this.hasIdol = true;
        this.score  += CONFIG.IDOL_SCORE;
      } else {
        this.score += CONFIG.TREASURE_SCORE;
      }
    }
  }

  _checkSpikes(room) {
    if (this._spikeDmgCd > 0) return;
    const pb = this.player.bounds;
    for (const spike of room.spikes) {
      if (rectsOverlap(pb, spike.bounds)) {
        this.player.takeDamage(spike.damage);
        this._spikeDmgCd = 0.6;
        break;
      }
    }
  }

  _checkEnemies(room) {
    if (this._enemyDmgCd > 0) return;
    const pb = this.player.bounds;
    for (const enemy of room.enemies) {
      if (!enemy.alive) continue;
      if (rectsOverlap(pb, enemy.bounds)) {
        this.player.takeDamage(1);
        this._enemyDmgCd = 0.8;
        break;
      }
    }
  }

  _checkDoors(room) {
    const pb = this.player.bounds;
    for (const door of room.doors) {
      if (!rectsOverlap(pb, door.bounds)) continue;

      // Win condition: exit door + has idol
      if (door.isExit && this.hasIdol) {
        this.victory = true;
        return;
      }

      // Room transition
      const nextRoom = this.world.getRoom(door.toRoomId);
      if (!nextRoom) continue;

      this._transition(door, nextRoom);
      return; // don't process more doors this frame
    }
  }

  /** Teleport player to next room, positioned opposite the door they came through. */
  _transition(door, nextRoom) {
    this.currentRoom = nextRoom;
    this._flashTimer = 0.18;

    const sp = nextRoom.spawnPos;
    const p  = this.player;

    // Place player on the opposite side of where they entered
    switch (door.side) {
      case 'right': p.x = CONFIG.TILE;                  p.y = sp.y; break;
      case 'left':  p.x = RW - CONFIG.TILE - p.w;      p.y = sp.y; break;
      case 'down':  p.x = sp.x; p.y = CONFIG.TILE;                  break;
      case 'up':    p.x = sp.x; p.y = RH - CONFIG.TILE - p.h;      break;
    }
    p.vx = 0;
    p.vy = 0;
    p.onGround = false;
  }

  // ── HUD ──────────────────────────────────────────────────────────────

  _drawHUD(ctx) {
    // Semi-transparent bar
    ctx.fillStyle = C.HUD_BG;
    ctx.fillRect(0, 0, RW, 28);

    // Health hearts
    const maxH = CONFIG.PLAYER_MAX_HEALTH;
    for (let i = 0; i < maxH; i++) {
      ctx.fillStyle = i < this.player.health ? C.HEART_ON : C.HEART_OFF;
      this._drawHeart(ctx, 10 + i * 22, 6, 14);
    }

    // Score
    ctx.fillStyle = C.TEXT;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${this.score}`, RW / 2, 19);
    ctx.textAlign = 'left';

    // Idol indicator
    if (this.hasIdol) {
      ctx.fillStyle = C.IDOL;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('☆ IDOL', RW - 8, 19);
      ctx.textAlign = 'left';
    }
  }

  /** Simple heart shape drawn with arcs. */
  _drawHeart(ctx, x, y, size) {
    const s = size / 2;
    ctx.beginPath();
    ctx.moveTo(x + s, y + size * 0.35);
    ctx.bezierCurveTo(x + s,       y,             x + size, y,             x + size, y + size * 0.35);
    ctx.bezierCurveTo(x + size,    y + size * 0.65, x + s, y + size * 0.9, x + s,  y + size);
    ctx.bezierCurveTo(x + s,       y + size * 0.9, x,      y + size * 0.65, x,     y + size * 0.35);
    ctx.bezierCurveTo(x,           y,             x + s,   y,             x + s,  y + size * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  // ── End-game overlays ────────────────────────────────────────────────

  _drawOverlay(ctx, won) {
    // Dim
    ctx.fillStyle = won ? 'rgba(0,60,20,0.82)' : 'rgba(40,0,0,0.82)';
    ctx.fillRect(0, 0, RW, RH);

    const accentCol = won ? C.WIN : C.LOSE;
    const headline  = won ? 'You escaped with the idol!' : 'You died in the tomb.';
    const sub       = `Score: ${this.score}`;

    // Box
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(RW / 2 - 190, RH / 2 - 70, 380, 140);
    ctx.strokeStyle = accentCol;
    ctx.lineWidth = 2;
    ctx.strokeRect(RW / 2 - 190, RH / 2 - 70, 380, 140);

    // Headline
    ctx.fillStyle = accentCol;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(headline, RW / 2, RH / 2 - 28);

    // Sub
    ctx.fillStyle = C.TEXT;
    ctx.font = '16px monospace';
    ctx.fillText(sub, RW / 2, RH / 2 + 10);

    // Restart hint
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '13px monospace';
    ctx.fillText('Press  R  to restart', RW / 2, RH / 2 + 42);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
