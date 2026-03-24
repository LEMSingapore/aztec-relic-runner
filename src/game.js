/**
 * game.js — Game state manager
 * Owns: current room, player instance, inventory, score, lives, game state.
 * Acts as the central coordinator between all subsystems.
 */

import { CONFIG } from './config.js';
import { PyramidMap } from './pyramid.js';
import { createPlayer, updatePlayer, drawPlayer, ANIM } from './player.js';
import { updateEntities, drawEntities, ENTITY_TYPES } from './entities.js';
import { drawItem, itemScore, ITEM_TYPES } from './items.js';
import { input } from './input.js';

const W   = CONFIG.INTERNAL_WIDTH;
const H   = CONFIG.INTERNAL_HEIGHT;
const HUD = CONFIG.HUD_HEIGHT;

/** Top-level game states */
export const GAME_STATE = {
  TITLE:     'title',
  PLAYING:   'playing',
  DEAD:      'dead',       // brief death pause before respawn
  GAME_OVER: 'game_over',
  VICTORY:   'victory',
};

const DEATH_PAUSE = 80;   // frames to show death before respawning / game over

export class Game {
  constructor() {
    this.state      = GAME_STATE.TITLE;
    this.score      = 0;
    this.lives      = CONFIG.STARTING_LIVES;
    this.inventory  = { key_red: 0, key_blue: 0, key_green: 0 };
    this.pyramid    = null;
    this.currentRoom = null;
    this.player     = null;
    this.deathTimer = 0;
    this.victoryTimer = 0;
    // Track which room the player spawns into on death (most recent room entry)
    this._spawnRoom  = 0;
    this._spawnX     = 0;
    this._spawnY     = 0;
    this.transitioning = false;
    this._transitionCooldown = 0;
  }

  /** Start or restart the game */
  start() {
    this.score     = 0;
    this.lives     = CONFIG.STARTING_LIVES;
    this.inventory = { key_red: 0, key_blue: 0, key_green: 0 };
    this.pyramid   = new PyramidMap();
    this._enterRoom(this.pyramid.startRoomId, W / 2 - CONFIG.PLAYER_WIDTH / 2, HUD + 10);
    this.state     = GAME_STATE.PLAYING;
  }

  _enterRoom(roomId, spawnX, spawnY) {
    this.currentRoom = this.pyramid.getRoom(roomId);
    this.player = createPlayer(spawnX, spawnY);
    this._spawnRoom = roomId;
    this._spawnX = spawnX;
    this._spawnY = spawnY;
    this._transitionCooldown = 45; // frames before doors can trigger
  }

  /** Main update — called once per frame */
  update() {
    switch (this.state) {
      case GAME_STATE.TITLE:     this._updateTitle();   break;
      case GAME_STATE.PLAYING:   this._updatePlaying(); break;
      case GAME_STATE.DEAD:      this._updateDead();    break;
      case GAME_STATE.GAME_OVER: this._updateGameOver();break;
      case GAME_STATE.VICTORY:   this._updateVictory(); break;
    }
  }

  // ─── State handlers ──────────────────────────────────────────────────────

  _updateTitle() {
    if (input.restartPressed || input.jumpPressed) {
      this.start();
    }
  }

  _updatePlaying() {
    const room   = this.currentRoom;
    const player = this.player;

    // Update player physics
    updatePlayer(player, room);

    // Update entities
    updateEntities(room.entities);

    // ── Item pickup ──────────────────────────────────────────────────────
    for (const item of room.items) {
      if (!item.collected && _aabbOverlap(player, item)) {
        item.collected = true;
        this.score += itemScore(item.type);
        if (item.type === ITEM_TYPES.KEY_RED)   this.inventory.key_red++;
        if (item.type === ITEM_TYPES.KEY_BLUE)  this.inventory.key_blue++;
        if (item.type === ITEM_TYPES.KEY_GREEN) this.inventory.key_green++;

        // Picking up amulet in treasure chamber = victory
        if (item.type === ITEM_TYPES.AMULET && room.isTreasure) {
          this.score += CONFIG.TREASURE_CHAMBER_BONUS;
          this.state = GAME_STATE.VICTORY;
          this.victoryTimer = 0;
          return;
        }
      }
    }

    // ── Enemy / hazard collision ──────────────────────────────────────────
    if (!player.dead) {
      for (const e of room.entities) {
        if (e.type === ENTITY_TYPES.FIRE_PIT) {
          if (_aabbOverlap(player, e)) {
            this._killPlayer();
            return;
          }
        } else {
          // Skull or spider
          if (!e.dead && _aabbOverlap(player, e)) {
            this._killPlayer();
            return;
          }
        }
      }
    }

    // ── Transition cooldown (prevents immediately re-entering through same door) ──
    if (this._transitionCooldown > 0) {
      this._transitionCooldown--;
    }

    // ── Room transition via doors ─────────────────────────────────────────
    for (const door of room.doors) {
      if (this._transitionCooldown > 0) break;
      if (!_aabbOverlap(player, door)) continue;

      // Check if locked
      if (door.color === 'red'   && this.inventory.key_red   === 0) continue;
      if (door.color === 'blue'  && this.inventory.key_blue  === 0) continue;
      if (door.color === 'green' && this.inventory.key_green === 0) continue;

      // Consume key (only if door is actually locked)
      if (door.color === 'red')   { this.inventory.key_red--;   }
      if (door.color === 'blue')  { this.inventory.key_blue--;  }
      if (door.color === 'green') { this.inventory.key_green--; }

      this._enterRoom(door.toRoom, door.spawnX, door.spawnY);
      return;
    }

    // ── Room transition via drop gaps (fall through floor holes) ─────────
    for (const gap of room.dropGaps) {
      const bottom = HUD + (H - HUD) - 16;
      // Player falls off bottom of screen through a gap
      if (player.y + player.height >= bottom - 2 &&
          player.x + player.width > gap.x &&
          player.x < gap.x + gap.w) {
        this._enterRoom(gap.toRoom, gap.spawnX, gap.spawnY);
        return;
      }
    }

    // ── Fell off bottom of screen (no gap) — die ──────────────────────────
    if (player.y > H) {
      this._killPlayer();
    }
  }

  _killPlayer() {
    this.player.dead = true;
    this.player.anim = ANIM.DEAD;
    this.deathTimer = 0;
    this.state = GAME_STATE.DEAD;
  }

  _updateDead() {
    this.deathTimer++;
    if (this.deathTimer >= DEATH_PAUSE) {
      this.lives--;
      if (this.lives <= 0) {
        this.state = GAME_STATE.GAME_OVER;
      } else {
        // Respawn in same room
        this._enterRoom(this._spawnRoom, this._spawnX, this._spawnY);
        this.state = GAME_STATE.PLAYING;
      }
    }
  }

  _updateGameOver() {
    if (input.restartPressed) this.start();
  }

  _updateVictory() {
    this.victoryTimer++;
    if (input.restartPressed && this.victoryTimer > 60) this.start();
  }

  // ─── Rendering ───────────────────────────────────────────────────────────

  /**
   * Draw the current game frame onto ctx.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    switch (this.state) {
      case GAME_STATE.TITLE:     this._drawTitle(ctx);   break;
      case GAME_STATE.PLAYING:
      case GAME_STATE.DEAD:      this._drawPlaying(ctx); break;
      case GAME_STATE.GAME_OVER: this._drawGameOver(ctx);break;
      case GAME_STATE.VICTORY:   this._drawVictory(ctx); break;
    }
  }

  _drawPlaying(ctx) {
    const room = this.currentRoom;
    const C    = CONFIG.COLORS;

    // Background fill
    ctx.fillStyle = room.bgColor;
    ctx.fillRect(0, HUD, W, H - HUD);

    // Subtle dot pattern overlay
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let dx = 8; dx < W; dx += 16) {
      for (let dy = HUD + 8; dy < H; dy += 16) {
        ctx.fillRect(dx, dy, 1, 1);
      }
    }

    // Draw ladders BEFORE platforms so platforms visually cover them at surface level
    for (const ladder of room.ladders) {
      ctx.strokeStyle = '#ddaa44';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ladder.x, ladder.y); ctx.lineTo(ladder.x, ladder.y + ladder.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ladder.x + 8, ladder.y); ctx.lineTo(ladder.x + 8, ladder.y + ladder.h); ctx.stroke();
      ctx.lineWidth = 2;
      for (let ry = ladder.y; ry <= ladder.y + ladder.h; ry += 8) {
        ctx.beginPath(); ctx.moveTo(ladder.x, ry); ctx.lineTo(ladder.x + 8, ry); ctx.stroke();
      }
    }

    // Draw chains as oval links
    for (const chain of room.chains) {
      ctx.strokeStyle = '#bbbbbb';
      ctx.lineWidth = 1.5;
      for (let cy = chain.y; cy < chain.y + chain.h; cy += 6) {
        const linkIdx = Math.floor((cy - chain.y) / 6);
        const xOff = (linkIdx % 2) * 2;
        ctx.beginPath();
        ctx.ellipse(chain.x + 2 + xOff, cy + 3, 2, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw platforms (rendered AFTER ladders so they cover ladder tops cleanly)
    for (const plat of room.platforms) {
      const isWall = plat.w === 8 && (plat.x === 0 || plat.x === W - 8);

      if (isWall) {
        // Stone wall with horizontal seams and diamond carvings
        ctx.fillStyle = '#5533aa';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = '#3322aa';
        for (let sy = plat.y; sy < plat.y + plat.h; sy += 16) {
          ctx.fillRect(plat.x, sy, plat.w, 1);
        }
        ctx.strokeStyle = '#7755dd';
        ctx.lineWidth = 1;
        const wcx = plat.x + plat.w / 2;
        for (let dy = plat.y + 16; dy < plat.y + plat.h; dy += 32) {
          ctx.beginPath();
          ctx.moveTo(wcx,     dy - 3);
          ctx.lineTo(wcx + 2, dy);
          ctx.lineTo(wcx,     dy + 3);
          ctx.lineTo(wcx - 2, dy);
          ctx.closePath();
          ctx.stroke();
        }
      } else {
        // Stone brick platform
        ctx.fillStyle = '#7755cc';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        // Top highlight
        ctx.fillStyle = '#aa88ff';
        ctx.fillRect(plat.x, plat.y, plat.w, 2);
        // Bottom shadow
        ctx.fillStyle = '#3322aa';
        ctx.fillRect(plat.x, plat.y + plat.h - 2, plat.w, 2);
        // Vertical brick seams every 16px
        ctx.fillStyle = '#5533aa';
        for (let sx = plat.x + 16; sx < plat.x + plat.w; sx += 16) {
          ctx.fillRect(sx, plat.y, 1, plat.h);
        }
      }
    }

    // Draw doors
    for (const door of room.doors) {
      _drawDoor(ctx, door, this.inventory);
    }

    // Draw items
    for (const item of room.items) {
      drawItem(ctx, item);
    }

    // Draw entities
    drawEntities(ctx, room.entities);

    // Draw player
    drawPlayer(ctx, this.player);

    // Draw HUD
    this._drawHUD(ctx);

    // Room name banner
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '9px ' + CONFIG.FONT;
    ctx.textAlign = 'center';
    ctx.fillText(room.name.toUpperCase(), W / 2, HUD + 12);
    ctx.textAlign = 'left';
  }

  _drawHUD(ctx) {
    const C = CONFIG.COLORS;
    // HUD gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, HUD);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(1, '#0d0620');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, HUD);
    // Separator line
    ctx.fillStyle = '#5533aa';
    ctx.fillRect(0, HUD - 1, W, 1);

    // Score (left)
    ctx.fillStyle = C.SCORE_TEXT;
    ctx.font = 'bold 9px ' + CONFIG.FONT;
    ctx.textAlign = 'left';
    ctx.fillText(`${this.score}`, 4, 13);

    // Lives as pixel-art hearts
    let lx = 70;
    for (let i = 0; i < this.lives; i++) {
      // Heart: two circles + triangle
      ctx.fillStyle = '#ff3344';
      ctx.beginPath(); ctx.arc(lx + 2, 8, 2.5, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(lx + 5, 8, 2.5, Math.PI, 0); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(lx, 8); ctx.lineTo(lx + 3.5, 14); ctx.lineTo(lx + 7, 8);
      ctx.closePath(); ctx.fill();
      lx += 11;
    }

    // Keys in HUD
    const keyColors = [
      { k: 'key_red',   color: C.KEY_RED },
      { k: 'key_blue',  color: C.KEY_BLUE },
      { k: 'key_green', color: C.KEY_GREEN },
    ];
    let kx = 180;
    for (const { k, color } of keyColors) {
      const count = this.inventory[k];
      if (count > 0) {
        // Mini key icon
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(kx + 3, 10, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(kx + 3, 11, 7, 2);
        ctx.fillRect(kx + 8, 12, 1, 2);
        ctx.fillRect(kx + 6, 12, 1, 2);
        ctx.fillStyle = C.TEXT;
        ctx.font = '9px ' + CONFIG.FONT;
        ctx.textAlign = 'left';
        ctx.fillText(count, kx + 12, 14);
        kx += 18;
      }
    }

    // Room name (right side, muted)
    ctx.fillStyle = 'rgba(180,150,255,0.55)';
    ctx.font = '9px ' + CONFIG.FONT;
    ctx.textAlign = 'right';
    ctx.fillText(this.currentRoom ? this.currentRoom.name.toUpperCase() : '', W - 4, 8);
    // Score label
    ctx.fillStyle = 'rgba(255,220,120,0.5)';
    ctx.font = '9px ' + CONFIG.FONT;
    ctx.textAlign = 'left';
    ctx.fillText('PTS', 4, 6);

    ctx.textAlign = 'left';
  }

  _drawTitle(ctx) {
    const C = CONFIG.COLORS;

    // Background gradient-ish
    ctx.fillStyle = C.BG;
    ctx.fillRect(0, 0, W, H);
    // Subtle star field
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 73 + 11) % W;
      const sy = (i * 47 + 7) % (H - 80);
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Pyramid silhouette (filled)
    const py = 55;
    ctx.fillStyle = '#1a0a3a';
    ctx.beginPath();
    ctx.moveTo(W / 2, py);
    ctx.lineTo(W - 20, 175);
    ctx.lineTo(20, 175);
    ctx.closePath();
    ctx.fill();

    // Pyramid outline with glow
    ctx.shadowColor = '#7744cc';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = C.WALL_LIGHT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, py);
    ctx.lineTo(W - 20, 175);
    ctx.lineTo(20, 175);
    ctx.closePath();
    ctx.stroke();

    // Pyramid steps (horizontal lines)
    ctx.strokeStyle = 'rgba(170,136,255,0.3)';
    ctx.lineWidth = 1;
    for (let s = 1; s <= 4; s++) {
      const t = s / 5;
      const sy2 = py + (175 - py) * t;
      const hw = (W / 2 - 20) * t;
      ctx.beginPath();
      ctx.moveTo(W / 2 - hw, sy2);
      ctx.lineTo(W / 2 + hw, sy2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Title with gold glow
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 12;
    ctx.fillStyle = C.TREASURE;
    ctx.font = 'bold 14px ' + CONFIG.FONT;
    ctx.textAlign = 'center';
    ctx.fillText('MONTE CLONE', W / 2, 28);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff9944';
    ctx.font = '7px ' + CONFIG.FONT;
    ctx.fillText('AZTEC RELIC RUNNER', W / 2, 44);

    // Jewel decoration
    ctx.fillStyle = C.JEWEL;
    ctx.font = '7px ' + CONFIG.FONT;
    ctx.fillText('FIND THE AMULET IN THE', W / 2, 182);
    ctx.fillText('TREASURE CHAMBER!', W / 2, 194);

    ctx.fillStyle = C.TEXT_DIM;
    ctx.font = '7px ' + CONFIG.FONT;
    ctx.fillText('ARROWS/WASD: MOVE & CLIMB', W / 2, 208);
    ctx.fillText('SPACE/K: JUMP', W / 2, 220);

    // Blinking start prompt
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.fillStyle = C.TEXT;
      ctx.font = '8px ' + CONFIG.FONT;
      ctx.fillText('PRESS SPACE TO START', W / 2, 236);
      ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
  }

  _drawGameOver(ctx) {
    const C = CONFIG.COLORS;
    // Dark red vignette
    ctx.fillStyle = '#0e0000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(80,0,0,0.4)';
    ctx.fillRect(40, 60, W - 80, 120);
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 60, W - 80, 120);

    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ff2222';
    ctx.font = 'bold 14px ' + CONFIG.FONT;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, 100);
    ctx.shadowBlur = 0;

    ctx.fillStyle = C.SCORE_TEXT;
    ctx.font = '8px ' + CONFIG.FONT;
    ctx.fillText('SCORE: ' + this.score, W / 2, 125);

    if (Math.floor(Date.now() / 600) % 2 === 0) {
      ctx.fillStyle = C.TEXT;
      ctx.font = '7px ' + CONFIG.FONT;
      ctx.fillText('ENTER / R  TO RETRY', W / 2, 155);
    }
    ctx.textAlign = 'left';
  }

  _drawVictory(ctx) {
    const C = CONFIG.COLORS;
    ctx.fillStyle = '#030e00';
    ctx.fillRect(0, 0, W, H);

    // Sparkle effect
    for (let i = 0; i < 20; i++) {
      const t = (Date.now() / 800 + i * 0.37) % 1;
      const sx = (i * 83 + 40) % (W - 20);
      const sy = 30 + ((i * 61 + this.victoryTimer) % (H - 60));
      ctx.fillStyle = `rgba(255,215,0,${1 - t})`;
      ctx.fillRect(sx, sy, 2, 2);
    }

    const pulse = 0.75 + 0.25 * Math.sin(this.victoryTimer * 0.08);
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = `rgba(255,215,0,${pulse})`;
    ctx.font = 'bold 14px ' + CONFIG.FONT;
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', W / 2, 85);
    ctx.shadowBlur = 0;

    ctx.fillStyle = C.JEWEL;
    ctx.font = '7px ' + CONFIG.FONT;
    ctx.fillText('AMULET RECOVERED!', W / 2, 108);

    ctx.fillStyle = C.SCORE_TEXT;
    ctx.font = '8px ' + CONFIG.FONT;
    ctx.fillText('SCORE: ' + this.score, W / 2, 130);

    if (this.victoryTimer > 60 && Math.floor(Date.now() / 600) % 2 === 0) {
      ctx.fillStyle = C.TEXT;
      ctx.font = '7px ' + CONFIG.FONT;
      ctx.fillText('ENTER / R  TO PLAY AGAIN', W / 2, 155);
    }
    ctx.textAlign = 'left';
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _aabbOverlap(a, b) {
  const bw = b.width  || b.w || 16;
  const bh = b.height || b.h || 16;
  return a.x < b.x + bw &&
         a.x + a.width > b.x &&
         a.y < b.y + bh &&
         a.y + a.height > b.y;
}

function _drawDoor(ctx, door, inventory) {
  const C = CONFIG.COLORS;
  const dx = door.x, dy = door.y, dw = door.w, dh = door.h;
  const cx = dx + dw / 2;
  const archR = dw / 2;

  if (door.color === 'open') {
    // Dark archway — reads as an open passage
    ctx.fillStyle = '#222233';
    ctx.beginPath();
    ctx.rect(dx, dy + archR, dw, dh - archR);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, dy + archR, archR, Math.PI, 0);
    ctx.fill();
    // Frame outline
    ctx.strokeStyle = '#5544aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dx, dy + dh);
    ctx.lineTo(dx, dy + archR);
    ctx.arc(cx, dy + archR, archR, Math.PI, 0);
    ctx.lineTo(dx + dw, dy + dh);
    ctx.stroke();
  } else {
    let color;
    switch (door.color) {
      case 'red':   color = C.DOOR_RED;   break;
      case 'blue':  color = C.DOOR_BLUE;  break;
      case 'green': color = C.DOOR_GREEN; break;
      default:      color = '#444455';    break;
    }

    const hasKey =
      (door.color === 'red'   && inventory.key_red   > 0) ||
      (door.color === 'blue'  && inventory.key_blue  > 0) ||
      (door.color === 'green' && inventory.key_green > 0);

    // Door body with arch
    ctx.fillStyle = hasKey ? color : _darkenColor(color, 0.5);
    ctx.beginPath();
    ctx.rect(dx, dy + archR, dw, dh - archR);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, dy + archR, archR, Math.PI, 0);
    ctx.fill();

    // Door frame (lighter border)
    ctx.strokeStyle = hasKey ? _lightenColor(color) : '#666666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dx, dy + dh);
    ctx.lineTo(dx, dy + archR);
    ctx.arc(cx, dy + archR, archR, Math.PI, 0);
    ctx.lineTo(dx + dw, dy + dh);
    ctx.stroke();

    // Keyhole symbol in center
    const kcy = dy + archR + (dh - archR) * 0.4;
    ctx.fillStyle = hasKey ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    ctx.arc(cx, kcy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 1.5, kcy, 3, 4);

    if (!hasKey) {
      // Dim overlay to show locked
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.rect(dx, dy + archR, dw, dh - archR);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, dy + archR, archR, Math.PI, 0);
      ctx.fill();
    }
  }
}

function _lightenColor(hex) {
  // Simple lighten by blending with white
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const lr = Math.min(255, r + 80);
  const lg = Math.min(255, g + 80);
  const lb = Math.min(255, b + 80);
  return `rgb(${lr},${lg},${lb})`;
}

function _darkenColor(hex, factor) {
  const r = Math.floor(parseInt(hex.slice(1,3), 16) * factor);
  const g = Math.floor(parseInt(hex.slice(3,5), 16) * factor);
  const b = Math.floor(Math.min(255, parseInt(hex.slice(5,7), 16) * factor));
  return `rgb(${r},${g},${b})`;
}
