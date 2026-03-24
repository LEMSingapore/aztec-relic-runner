/**
 * items.js — Collectible items: keys, jewels, torches, swords, amulets
 * Each item is a plain object with position, type, and collected state.
 */

import { CONFIG } from './config.js';
import { drawItemSprite } from './sprites.js';

// Map item types to sprite names
const ITEM_SPRITE_MAP = {
  'key_red':   'key_red',
  'key_blue':  'key_blue',
  'key_green': 'key_green',
  'jewel':     'jewel',
  'amulet':    'amulet',
  'torch':     'torch',
  'sword':     'sword',
};

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
  const { x, type } = item;
  // Float animation: ±2px sine wave
  const floatY = item.y + Math.sin(Date.now() / 400 + item.x) * 2;
  const y = floatY;

  // Try sprite first
  const spriteName = ITEM_SPRITE_MAP[type];
  if (spriteName) {
    const drew = drawItemSprite(ctx, spriteName, x + item.width / 2, floatY + item.height / 2, 16);
    if (drew) return;
  }

  ctx.fillStyle = color;

  if (type === ITEM_TYPES.KEY_RED || type === ITEM_TYPES.KEY_BLUE || type === ITEM_TYPES.KEY_GREEN) {
    // Bigger key: circle head r=5 + shaft with 2 teeth
    ctx.beginPath();
    ctx.arc(x + 5, y + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    // Hollow center
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(x + 5, y + 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    // Shaft
    ctx.fillRect(x + 5, y + 7, 10, 3);
    // Two teeth
    ctx.fillRect(x + 11, y + 9, 2, 3);
    ctx.fillRect(x + 8, y + 9, 2, 2);
  } else if (type === ITEM_TYPES.JEWEL) {
    // Large 14px diamond with inner highlight
    ctx.beginPath();
    ctx.moveTo(x + 7, y);
    ctx.lineTo(x + 14, y + 7);
    ctx.lineTo(x + 7, y + 14);
    ctx.lineTo(x, y + 7);
    ctx.closePath();
    ctx.fill();
    // Inner highlight triangle
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 2);
    ctx.lineTo(x + 12, y + 6);
    ctx.lineTo(x + 7, y + 6);
    ctx.closePath();
    ctx.fill();
  } else if (type === ITEM_TYPES.TORCH) {
    // Brown handle
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + 5, y + 6, 4, 8);
    // Wrap
    ctx.fillStyle = '#5c2e00';
    ctx.fillRect(x + 5, y + 8, 4, 1);
    ctx.fillRect(x + 5, y + 11, 4, 1);
    // Flickering flame
    const flicker = Math.sin(Date.now() / 120 + x) * 2;
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 7);
    ctx.lineTo(x + 10, y + 7);
    ctx.lineTo(x + 7 + flicker * 0.5, y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffee00';
    ctx.beginPath();
    ctx.moveTo(x + 5.5, y + 7);
    ctx.lineTo(x + 8.5, y + 7);
    ctx.lineTo(x + 7 + flicker * 0.3, y + 3);
    ctx.closePath();
    ctx.fill();
  } else if (type === ITEM_TYPES.SWORD) {
    // Silver blade
    ctx.fillStyle = '#ccccff';
    ctx.fillRect(x + 6, y, 3, 12);
    // Tip
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 12);
    ctx.lineTo(x + 9, y + 12);
    ctx.lineTo(x + 7.5, y + 15);
    ctx.closePath();
    ctx.fill();
    // Gold guard
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(x + 2, y + 5, 11, 3);
    // Handle
    ctx.fillStyle = '#885522';
    ctx.fillRect(x + 6, y - 4, 3, 6);
    // Pommel
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(x + 7.5, y - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === ITEM_TYPES.AMULET) {
    // Sun-like shape with rays
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);
    ctx.shadowColor = '#ffdd00';
    ctx.shadowBlur = 8 * pulse;
    ctx.fillStyle = '#ffdd00';
    // Center circle
    ctx.beginPath();
    ctx.arc(x + 7, y + 7, 4, 0, Math.PI * 2);
    ctx.fill();
    // 8 rays
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rx1 = x + 7 + Math.cos(angle) * 5;
      const ry1 = y + 7 + Math.sin(angle) * 5;
      const rx2 = x + 7 + Math.cos(angle) * 8;
      const ry2 = y + 7 + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.moveTo(rx1, ry1);
      ctx.lineTo(rx2, ry2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffdd00';
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  } else {
    ctx.fillRect(x, y, item.width, item.height);
  }
}
