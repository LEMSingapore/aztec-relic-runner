/**
 * sprites.js — Sprite loader and draw helpers
 * Loads all AI-generated PNG sprites and exposes draw functions.
 * Falls back to canvas shapes if images fail to load.
 */

const SPRITE_DIR = './sprites/';

// ─── Sprite registry ─────────────────────────────────────────────────────────

const _imgs = {};
const _loaded = {};
const _failed = {};

function loadSprite(name, src) {
  const img = new Image();
  img.onload  = () => { _loaded[name] = true; };
  img.onerror = () => { _failed[name] = true; console.warn(`Sprite failed: ${name}`); };
  img.src = src;
  _imgs[name] = img;
}

// Pre-load all sprites
export function initSprites() {
  loadSprite('player',    SPRITE_DIR + 'player.png');
  loadSprite('skull',     SPRITE_DIR + 'skull.png');
  loadSprite('spider',    SPRITE_DIR + 'spider.png');
  loadSprite('jewel',     SPRITE_DIR + 'jewel.png');
  loadSprite('key_red',   SPRITE_DIR + 'key_red.png');
  loadSprite('key_blue',  SPRITE_DIR + 'key_blue.png');
  loadSprite('key_green', SPRITE_DIR + 'key_green.png');
  loadSprite('amulet',    SPRITE_DIR + 'amulet.png');
  loadSprite('torch',     SPRITE_DIR + 'torch.png');
  loadSprite('sword',     SPRITE_DIR + 'sword.png');
  loadSprite('fire',      SPRITE_DIR + 'fire.png');
  loadSprite('tile_wall', SPRITE_DIR + 'tile_wall.png');
  loadSprite('tile_floor',SPRITE_DIR + 'tile_floor.png');
}

/** True if a sprite loaded OK */
export function spriteReady(name) {
  return _loaded[name] === true;
}

/** Get raw image (or null) */
export function getSprite(name) {
  return spriteReady(name) ? _imgs[name] : null;
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

/**
 * Draw the player from the sprite sheet.
 * Sheet has 4 frames in a horizontal strip: walk1, walk2, jump, climb
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w - target width
 * @param {number} h - target height
 * @param {number} frameIndex - 0=walk1,1=walk2,2=jump,3=climb
 * @param {boolean} flipX
 */
export function drawPlayerSprite(ctx, x, y, w, h, frameIndex, flipX) {
  const img = getSprite('player');
  if (!img) return false;

  const FRAMES = 4;
  const fw = img.naturalWidth / FRAMES;
  const fh = img.naturalHeight;
  const fi = Math.min(frameIndex, FRAMES - 1);

  ctx.save();
  if (flipX) {
    ctx.translate(x + w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), 0);
  }
  ctx.drawImage(img, fi * fw, 0, fw, fh, x, y, w, h);
  ctx.restore();
  return true;
}

/**
 * Draw skull enemy — 4-frame rolling animation.
 */
export function drawSkullSprite(ctx, x, y, w, h, frameIndex) {
  const img = getSprite('skull');
  if (!img) return false;

  const FRAMES = 4;
  const fw = img.naturalWidth / FRAMES;
  const fi = frameIndex % FRAMES;
  ctx.drawImage(img, fi * fw, 0, fw, img.naturalHeight, x, y, w, h);
  return true;
}

/**
 * Draw spider enemy — 4-frame animation.
 */
export function drawSpiderSprite(ctx, x, y, w, h, frameIndex) {
  const img = getSprite('spider');
  if (!img) return false;

  const FRAMES = 4;
  const fw = img.naturalWidth / FRAMES;
  const fi = frameIndex % FRAMES;
  ctx.drawImage(img, fi * fw, 0, fw, img.naturalHeight, x, y, w, h);
  return true;
}

/**
 * Draw fire pit — 3-frame animation.
 */
export function drawFireSprite(ctx, x, y, w, h, frameIndex) {
  const img = getSprite('fire');
  if (!img) return false;

  const FRAMES = 3;
  const fw = img.naturalWidth / FRAMES;
  const fi = frameIndex % FRAMES;
  ctx.drawImage(img, fi * fw, 0, fw, img.naturalHeight, x, y, w, h);
  return true;
}

/**
 * Draw a simple item sprite (jewel, key, amulet, etc.) centered at x, y.
 */
export function drawItemSprite(ctx, name, x, y, size) {
  const img = getSprite(name);
  if (!img) return false;
  // Float animation
  const floatY = Math.sin(Date.now() / 600) * 2;
  ctx.drawImage(img, x - size / 2, y - size / 2 + floatY, size, size);
  return true;
}

/**
 * Draw a tiled wall/floor texture across a rectangle.
 * @param {string} tileName - 'tile_wall' or 'tile_floor'
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} rx, ry, rw, rh - rectangle
 */
export function drawTiledRect(ctx, tileName, rx, ry, rw, rh) {
  const img = getSprite(tileName);
  if (!img) return false;

  const tw = Math.max(1, img.naturalWidth);
  const th = Math.max(1, img.naturalHeight);

  // Use createPattern for seamless tiling
  const pattern = ctx.createPattern(img, 'repeat');
  if (!pattern) return false;

  ctx.save();
  ctx.translate(rx, ry);
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, rw, rh);
  ctx.restore();
  return true;
}
