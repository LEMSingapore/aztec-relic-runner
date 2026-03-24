/**
 * items.js — Collectible items: keys, jewels, torches, swords, amulets
 * Each item is a plain object with position, type, and collected state.
 */

import { CONFIG } from './config.js';

// Item type constants
export const ITEM_TYPES = {
  KEY_RED:   'key_red',
  KEY_BLUE:  'key_blue',
  KEY_GREEN: 'key_green',
  JEWEL:     'jewel',
  TORCH:     'torch',
  SWORD:     'sword',
  AMULET:    'amulet',
};

/**
 * Create an item object.
 * @param {string} type - One of ITEM_TYPES values
 * @param {number} x - Pixel x position (left edge)
 * @param {number} y - Pixel y position (top edge)
 */
export function createItem(type, x, y) {
  return {
    type,
    x,
    y,
    width: 12,
    height: 12,
    collected: false,
  };
}

/** Return the color to use when drawing this item */
export function itemColor(type) {
  const C = CONFIG.COLORS;
  switch (type) {
    case ITEM_TYPES.KEY_RED:   return C.KEY_RED;
    case ITEM_TYPES.KEY_BLUE:  return C.KEY_BLUE;
    case ITEM_TYPES.KEY_GREEN: return C.KEY_GREEN;
    case ITEM_TYPES.JEWEL:     return C.JEWEL;
    case ITEM_TYPES.TORCH:     return C.TORCH;
    case ITEM_TYPES.SWORD:     return C.SWORD;
    case ITEM_TYPES.AMULET:    return C.AMULET;
    default:                   return '#ffffff';
  }
}

/** Score awarded when picking up an item */
export function itemScore(type) {
  switch (type) {
    case ITEM_TYPES.KEY_RED:
    case ITEM_TYPES.KEY_BLUE:
    case ITEM_TYPES.KEY_GREEN: return CONFIG.KEY_SCORE;
    case ITEM_TYPES.JEWEL:     return CONFIG.JEWEL_SCORE;
    case ITEM_TYPES.TORCH:     return 150;
    case ITEM_TYPES.SWORD:     return 200;
    case ITEM_TYPES.AMULET:    return 500;
    default:                   return 0;
  }
}

/** Draw a single item onto a canvas context (called by room renderer) */
export function drawItem(ctx, item) {
  if (item.collected) return;
  const color = itemColor(item.type);
  const { x, y, width, height, type } = item;

  ctx.fillStyle = color;

  if (type === ITEM_TYPES.KEY_RED || type === ITEM_TYPES.KEY_BLUE || type === ITEM_TYPES.KEY_GREEN) {
    // Draw a simple key shape: circle head + rectangle shaft
    ctx.beginPath();
    ctx.arc(x + 4, y + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 4, y + 6, 8, 3);
    ctx.fillRect(x + 9, y + 7, 2, 2);
    ctx.fillRect(x + 7, y + 7, 2, 2);
  } else if (type === ITEM_TYPES.JEWEL) {
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x + width / 2, y + height);
    ctx.lineTo(x, y + height / 2);
    ctx.closePath();
    ctx.fill();
  } else if (type === ITEM_TYPES.TORCH) {
    // Torch: rectangle stick + flame circle
    ctx.fillRect(x + 4, y + 4, 4, 8);
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(x + 6, y + 3, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === ITEM_TYPES.SWORD) {
    // Sword: thin cross
    ctx.fillRect(x + 5, y, 2, 12);
    ctx.fillRect(x + 1, y + 4, 10, 2);
  } else if (type === ITEM_TYPES.AMULET) {
    // Amulet: star-like shape (simple 4-point star)
    ctx.beginPath();
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x + 8, y + 4);
    ctx.lineTo(x + 12, y + 6);
    ctx.lineTo(x + 8, y + 8);
    ctx.lineTo(x + 6, y + 12);
    ctx.lineTo(x + 4, y + 8);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x + 4, y + 4);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(x, y, width, height);
  }
}
