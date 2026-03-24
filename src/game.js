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

    // Background
    ctx.fillStyle = room.bgColor;
    ctx.fillRect(0, HUD, W, H - HUD);

    // Draw platforms/walls
    ctx.fillStyle = C.WALL;
    for (const plat of room.platforms) {
      ctx.fillStyle = C.FLOOR;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      // Ledge highlight
      ctx.fillStyle = C.WALL;
      ctx.fillRect(plat.x, plat.y, plat.w, 2);
    }

    // Draw ladders
    ctx.strokeStyle = C.LADDER;
    ctx.lineWidth = 2;
    for (const ladder of room.ladders) {
      // Side rails
      ctx.beginPath(); ctx.moveTo(ladder.x, ladder.y); ctx.lineTo(ladder.x, ladder.y + ladder.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ladder.x + 8, ladder.y); ctx.lineTo(ladder.x + 8, ladder.y + ladder.h); ctx.stroke();
      // Rungs
      for (let ry = ladder.y; ry < ladder.y + ladder.h; ry += 8) {
        ctx.beginPath(); ctx.moveTo(ladder.x, ry); ctx.lineTo(ladder.x + 8, ry); ctx.stroke();
      }
    }

    // Draw chains
    ctx.strokeStyle = C.CHAIN;
    ctx.lineWidth = 2;
    for (const chain of room.chains) {
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(chain.x + 2, chain.y); ctx.lineTo(chain.x + 2, chain.y + chain.h); ctx.stroke();
      ctx.setLineDash([]);
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

    // Room name banner (fade in)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(room.name.toUpperCase(), W / 2, HUD + 12);
    ctx.textAlign = 'left';
  }

  _drawHUD(ctx) {
    const C = CONFIG.COLORS;
    ctx.fillStyle = C.HUD_BG;
    ctx.fillRect(0, 0, W, HUD);

    // Score
    ctx.fillStyle = C.SCORE_TEXT;
    ctx.font = '8px monospace';
    ctx.fillText(`SCORE:${this.score}`, 4, 13);

    // Lives
    ctx.fillStyle = C.PLAYER;
    ctx.fillText(`LIVES:${this.lives}`, 140, 13);

    // Keys
    const keyColors = [
      { k: 'key_red',   color: C.KEY_RED },
      { k: 'key_blue',  color: C.KEY_BLUE },
      { k: 'key_green', color: C.KEY_GREEN },
    ];
    let kx = 230;
    for (const { k, color } of keyColors) {
      const count = this.inventory[k];
      if (count > 0) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(kx + 4, 10, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.TEXT;
        ctx.fillText(count, kx + 10, 13);
        kx += 20;
      }
    }
  }

  _drawTitle(ctx) {
    const C = CONFIG.COLORS;
    ctx.fillStyle = C.BG;
    ctx.fillRect(0, 0, W, H);

    // Pyramid decorative shape
    ctx.strokeStyle = CONFIG.COLORS.WALL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 40);
    ctx.lineTo(W - 30, 160);
    ctx.lineTo(30, 160);
    ctx.closePath();
    ctx.stroke();

    // Title
    ctx.fillStyle = CONFIG.COLORS.TREASURE;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MONTE CLONE', W / 2, 30);

    ctx.fillStyle = '#ff9944';
    ctx.font = '8px monospace';
    ctx.fillText("AZTEC RELIC RUNNER", W / 2, 44);

    ctx.fillStyle = CONFIG.COLORS.JEWEL;
    ctx.font = '7px monospace';
    ctx.fillText('FIND THE AMULET IN THE', W / 2, 170);
    ctx.fillText('TREASURE CHAMBER!', W / 2, 180);

    ctx.fillStyle = '#aaa';
    ctx.font = '7px monospace';
    ctx.fillText('ARROWS / WASD : MOVE & CLIMB', W / 2, 195);
    ctx.fillText('SPACE / K : JUMP', W / 2, 205);

    // Blink press start
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = CONFIG.COLORS.TEXT;
      ctx.font = '8px monospace';
      ctx.fillText('PRESS SPACE TO START', W / 2, 220);
    }

    ctx.textAlign = 'left';
  }

  _drawGameOver(ctx) {
    const C = CONFIG.COLORS;
    ctx.fillStyle = '#110000';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ff2222';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, 100);

    ctx.fillStyle = C.SCORE_TEXT;
    ctx.font = '8px monospace';
    ctx.fillText(`FINAL SCORE: ${this.score}`, W / 2, 120);

    ctx.fillStyle = C.TEXT;
    ctx.fillText('PRESS ENTER/R TO RETRY', W / 2, 140);
    ctx.textAlign = 'left';
  }

  _drawVictory(ctx) {
    const C = CONFIG.COLORS;
    ctx.fillStyle = '#001100';
    ctx.fillRect(0, 0, W, H);

    // Pulsing gold title
    const pulse = 0.7 + 0.3 * Math.sin(this.victoryTimer * 0.1);
    ctx.fillStyle = `rgba(255,215,0,${pulse})`;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU FOUND THE AMULET!', W / 2, 80);

    ctx.fillStyle = CONFIG.COLORS.JEWEL;
    ctx.font = '10px monospace';
    ctx.fillText('VICTORY!', W / 2, 100);

    ctx.fillStyle = C.SCORE_TEXT;
    ctx.font = '8px monospace';
    ctx.fillText(`FINAL SCORE: ${this.score}`, W / 2, 120);

    if (this.victoryTimer > 60 && Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = C.TEXT;
      ctx.fillText('PRESS ENTER/R TO PLAY AGAIN', W / 2, 145);
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
  let color;
  switch (door.color) {
    case 'red':   color = C.DOOR_RED;   break;
    case 'blue':  color = C.DOOR_BLUE;  break;
    case 'green': color = C.DOOR_GREEN; break;
    default:      color = '#444455';    break;  // open / passable
  }

  // Door frame
  ctx.fillStyle = color;
  ctx.fillRect(door.x, door.y, door.w, door.h);

  // Door inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(door.x + 2, door.y + 2, door.w - 4, door.h - 4);

  // Lock icon if color-keyed
  if (door.color !== 'open') {
    // Check if player has the key — dim if missing
    const hasKey =
      (door.color === 'red'   && inventory.key_red   > 0) ||
      (door.color === 'blue'  && inventory.key_blue  > 0) ||
      (door.color === 'green' && inventory.key_green > 0);

    if (!hasKey) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(door.x, door.y, door.w, door.h);
      // Padlock circle
      ctx.strokeStyle = '#ffdd00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(door.x + door.w / 2, door.y + door.h / 2 - 4, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffdd00';
      ctx.fillRect(door.x + door.w / 2 - 4, door.y + door.h / 2, 8, 6);
    }
  }
}
