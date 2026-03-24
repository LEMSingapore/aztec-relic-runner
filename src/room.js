/**
 * room.js — Room definition: tiles, ladders, chains, doors, hazards, items
 *
 * A Room contains:
 *  - platforms: array of {x, y, w, h} solid rectangles
 *  - walls: left/right boundary walls
 *  - ladders: array of {x, y, h} (player can climb up/down)
 *  - chains: array of {x, y, h} (same as ladder, visually different)
 *  - doors: array of {x, y, color, toRoom, spawnX, spawnY}
 *  - dropGaps: array of {x, w, toRoom, spawnX, spawnY} — fall through to next room
 *  - items: array of item objects (from items.js)
 *  - entities: array of entity objects (from entities.js)
 *  - floorIndex: which floor (0=top)
 *  - colIndex: column in the pyramid layout
 *  - isTreasure: boolean — this is the final treasure chamber
 */

import { CONFIG } from './config.js';
import { createItem, ITEM_TYPES } from './items.js';
import { createSkull, createSpider, createFirePit } from './entities.js';

const W = CONFIG.INTERNAL_WIDTH;   // 320
const H = CONFIG.INTERNAL_HEIGHT;  // 240
const HUD = CONFIG.HUD_HEIGHT;     // 20
const PLAY_H = H - HUD;            // 220 — playfield height

/** Create the ground platform at the bottom of a room */
function ground(gapLeft = -1, gapRight = -1) {
  // Full floor unless gap specified
  const floors = [];
  const y = HUD + PLAY_H - 16;
  if (gapLeft < 0) {
    floors.push({ x: 0, y, w: W, h: 16 });
  } else {
    // Left section
    if (gapLeft > 0) floors.push({ x: 0, y, w: gapLeft, h: 16 });
    // Right section
    if (gapRight < W) floors.push({ x: gapRight, y, w: W - gapRight, h: 16 });
  }
  return floors;
}

/**
 * Build a Room object.
 * All coordinates are in the 320×240 internal space.
 */
export function buildRoom(def) {
  return {
    id:          def.id,
    floorIndex:  def.floorIndex,
    colIndex:    def.colIndex,
    isTreasure:  def.isTreasure || false,
    platforms:   def.platforms  || [],
    ladders:     def.ladders    || [],
    chains:      def.chains     || [],
    doors:       def.doors      || [],
    dropGaps:    def.dropGaps   || [],
    items:       def.items      || [],
    entities:    def.entities   || [],
    bgColor:     def.bgColor    || CONFIG.COLORS.BG,
    // Used for transition labels
    name:        def.name       || `Room ${def.id}`,
  };
}

// ─── Room Definitions ─────────────────────────────────────────────────────────
// Floor 0 (top), Floor 1, Floor 2, Floor 3 (bottom with treasure chamber)
// Rooms are defined with explicit geometry.

/**
 * Shared helper: left/right solid walls
 */
function walls() {
  return [
    { x: 0,     y: HUD, w: 8,  h: PLAY_H },
    { x: W - 8, y: HUD, w: 8,  h: PLAY_H },
  ];
}

// ─── FLOOR 0 (Top of pyramid) — 4 rooms ────────────────────────────────────

const room_0_0 = buildRoom({
  id: 0, floorIndex: 0, colIndex: 0, name: 'Peak Chamber',
  platforms: [
    ...walls(),
    ...ground(),
    // Mid platform left
    { x: 40, y: HUD + 60,  w: 80, h: 8 },
    // Mid platform right
    { x: 200, y: HUD + 60, w: 80, h: 8 },
    // Center platform
    { x: 120, y: HUD + 120, w: 80, h: 8 },
  ],
  ladders: [
    // Center ladder going down to floor
    { x: 154, y: HUD + 128, h: 76 },
  ],
  doors: [
    // Right door → room 1 (floor 0, col 1)
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 1, spawnX: 24, spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.KEY_BLUE,  120, HUD + 100),
    createItem(ITEM_TYPES.TORCH,     180, HUD + 100),
  ],
  entities: [
    createSkull(60,  HUD + PLAY_H - 32, 10, 110),
  ],
});

const room_0_1 = buildRoom({
  id: 1, floorIndex: 0, colIndex: 1, name: 'Upper Passage',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 60,  y: HUD + 80, w: 80, h: 8 },
    { x: 180, y: HUD + 50, w: 80, h: 8 },
    { x: 130, y: HUD + 140, w: 60, h: 8 },
  ],
  ladders: [
    { x: 90, y: HUD + 88, h: 56 },
  ],
  chains: [
    { x: 200, y: HUD + 58, h: 80 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 0,  spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 2,  spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
    // Blue locked door to floor 1
    { x: 152,  y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'blue',  toRoom: 5,  spawnX: 152,    spawnY: HUD + PLAY_H - 48, keyColor: 'blue' },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL,    140, HUD + 115),
    createItem(ITEM_TYPES.KEY_RED,  182, HUD + 30),
  ],
  entities: [
    createSkull(100, HUD + PLAY_H - 32, 10, 300),
  ],
});

const room_0_2 = buildRoom({
  id: 2, floorIndex: 0, colIndex: 2, name: 'Sky Hall',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 50,  y: HUD + 70,  w: 90, h: 8 },
    { x: 180, y: HUD + 100, w: 90, h: 8 },
  ],
  chains: [
    { x: 160, y: HUD + 30, h: 120 },
  ],
  doors: [
    { x: 8,      y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 1, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 3, spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL,    80, HUD + 50),
    createItem(ITEM_TYPES.SWORD,   190, HUD + 80),
  ],
  entities: [
    createSpider(160, HUD + 38, HUD + 30, HUD + 140),
    createSkull(55, HUD + PLAY_H - 32, 10, 130),
  ],
});

const room_0_3 = buildRoom({
  id: 3, floorIndex: 0, colIndex: 3, name: 'East Wing',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 40,  y: HUD + 60,  w: 100, h: 8 },
    { x: 180, y: HUD + 90,  w: 100, h: 8 },
    { x: 110, y: HUD + 150, w: 80,  h: 8 },
  ],
  ladders: [
    { x: 154, y: HUD + 158, h: 56 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 2, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    // Red locked door down to floor 1
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'red', toRoom: 7, spawnX: 24, spawnY: HUD + PLAY_H - 48, keyColor: 'red' },
  ],
  items: [
    createItem(ITEM_TYPES.KEY_GREEN, 115, HUD + 130),
    createItem(ITEM_TYPES.JEWEL,     190, HUD + 70),
  ],
  entities: [
    createFirePit(100, HUD + PLAY_H - 28, 30),
    createSkull(200, HUD + PLAY_H - 32, 170, 305),
  ],
});

// ─── FLOOR 1 — 5 rooms ──────────────────────────────────────────────────────

const room_1_0 = buildRoom({
  id: 4, floorIndex: 1, colIndex: 0, name: 'Western Vault',
  platforms: [
    ...walls(),
    ...ground(100, 160),  // gap in middle
    { x: 60,  y: HUD + 60,  w: 80, h: 8 },
    { x: 180, y: HUD + 60,  w: 80, h: 8 },
    { x: 120, y: HUD + 130, w: 80, h: 8 },
  ],
  ladders: [
    { x: 90,  y: HUD + 68, h: 76 },
    { x: 200, y: HUD + 68, h: 76 },
  ],
  dropGaps: [
    // Fall through center gap to room 9
    { x: 100, w: 60, toRoom: 9, spawnX: 130, spawnY: HUD + 30 },
  ],
  doors: [
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 5, spawnX: 24, spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL,  130, HUD + 110),
    createItem(ITEM_TYPES.TORCH,  65, HUD + 40),
  ],
  entities: [
    createSkull(185, HUD + PLAY_H - 32, 165, 305),
  ],
});

const room_1_1 = buildRoom({
  id: 5, floorIndex: 1, colIndex: 1, name: 'Skull Corridor',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 40,  y: HUD + 80,  w: 60, h: 8 },
    { x: 140, y: HUD + 50,  w: 60, h: 8 },
    { x: 220, y: HUD + 80,  w: 60, h: 8 },
  ],
  ladders: [
    { x: 155, y: HUD + 58, h: 90 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 4,  spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 6,  spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
    // Down to floor 2 via blue door (came from room 1 floor 0)
    { x: 152, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 10, spawnX: 152, spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL, 170, HUD + 30),
    createItem(ITEM_TYPES.KEY_BLUE, 45, HUD + 60),
  ],
  entities: [
    createSkull(60,  HUD + PLAY_H - 32, 10, 120),
    createSkull(225, HUD + PLAY_H - 32, 165, 305),
    createFirePit(150, HUD + PLAY_H - 28, 24),
  ],
});

const room_1_2 = buildRoom({
  id: 6, floorIndex: 1, colIndex: 2, name: 'Chain Hall',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 60,  y: HUD + 100, w: 80, h: 8 },
    { x: 180, y: HUD + 70,  w: 80, h: 8 },
  ],
  chains: [
    { x: 95,  y: HUD + 20,  h: 80 },
    { x: 215, y: HUD + 20,  h: 50 },
  ],
  doors: [
    { x: 8,      y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 5,  spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 7,  spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
    // Down green door → floor 2
    { x: 152,  y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'green', toRoom: 12, spawnX: 152, spawnY: HUD + PLAY_H - 48, keyColor: 'green' },
  ],
  items: [
    createItem(ITEM_TYPES.AMULET, 190, HUD + 50),
    createItem(ITEM_TYPES.JEWEL,  65,  HUD + 80),
  ],
  entities: [
    createSpider(95, HUD + 28, HUD + 28, HUD + 96),
    createSpider(215, HUD + 28, HUD + 28, HUD + 66),
  ],
});

const room_1_3 = buildRoom({
  id: 7, floorIndex: 1, colIndex: 3, name: 'Fire Corridor',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 60,  y: HUD + 90, w: 70, h: 8 },
    { x: 190, y: HUD + 60, w: 70, h: 8 },
    { x: 120, y: HUD + 150, w: 80, h: 8 },
  ],
  ladders: [
    { x: 154, y: HUD + 158, h: 56 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 6,  spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 8,  spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
    // Down red door  (entered from room 3 floor 0)
    { x: 8, y: HUD + 20, w: 16, h: 32, color: 'open', toRoom: 13, spawnX: 24, spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL,     125, HUD + 130),
    createItem(ITEM_TYPES.KEY_GREEN,  65, HUD + 70),
  ],
  entities: [
    createFirePit(60, HUD + PLAY_H - 28, 30),
    createFirePit(190, HUD + PLAY_H - 28, 30),
    createSkull(130, HUD + PLAY_H - 32, 10, 305),
  ],
});

const room_1_4 = buildRoom({
  id: 8, floorIndex: 1, colIndex: 4, name: 'East Vault',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 50,  y: HUD + 80, w: 90, h: 8 },
    { x: 180, y: HUD + 50, w: 90, h: 8 },
  ],
  chains: [
    { x: 160, y: HUD + 20, h: 110 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 7, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
  ],
  dropGaps: [
    { x: 140, w: 40, toRoom: 14, spawnX: 155, spawnY: HUD + 30 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL,  185, HUD + 30),
    createItem(ITEM_TYPES.TORCH,  55, HUD + 60),
  ],
  entities: [
    createSkull(200, HUD + PLAY_H - 32, 50, 305),
  ],
});

// ─── FLOOR 2 — 5 rooms ──────────────────────────────────────────────────────

const room_2_0 = buildRoom({
  id: 9, floorIndex: 2, colIndex: 0, name: 'Deep West',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 40,  y: HUD + 60,  w: 80, h: 8 },
    { x: 200, y: HUD + 60,  w: 80, h: 8 },
    { x: 120, y: HUD + 120, w: 80, h: 8 },
  ],
  ladders: [
    { x: 70,  y: HUD + 68, h: 76 },
    { x: 154, y: HUD + 128, h: 76 },
  ],
  doors: [
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 10, spawnX: 24, spawnY: HUD + PLAY_H - 48 },
    // Up — goes back to room 4
    { x: 8, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 4, spawnX: 130, spawnY: HUD + 140 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL, 130, HUD + 100),
    createItem(ITEM_TYPES.KEY_RED, 205, HUD + 40),
  ],
  entities: [
    createFirePit(70, HUD + PLAY_H - 28, 30),
    createSkull(210, HUD + PLAY_H - 32, 165, 305),
  ],
});

const room_2_1 = buildRoom({
  id: 10, floorIndex: 2, colIndex: 1, name: 'Mid Passage',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 60,  y: HUD + 70,  w: 80, h: 8 },
    { x: 180, y: HUD + 100, w: 80, h: 8 },
    { x: 120, y: HUD + 150, w: 80, h: 8 },
  ],
  chains: [
    { x: 95,  y: HUD + 20, h: 50 },
    { x: 215, y: HUD + 20, h: 80 },
  ],
  ladders: [
    { x: 154, y: HUD + 158, h: 56 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 9,  spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 11, spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
    { x: 152, y: HUD + 20, w: 16, h: 32, color: 'open', toRoom: 5, spawnX: 152, spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL, 65,  HUD + 50),
    createItem(ITEM_TYPES.JEWEL, 185, HUD + 80),
  ],
  entities: [
    createSpider(95,  HUD + 28, HUD + 28, HUD + 66),
    createSpider(215, HUD + 28, HUD + 28, HUD + 96),
    createSkull(130, HUD + PLAY_H - 32, 10, 305),
  ],
});

const room_2_2 = buildRoom({
  id: 11, floorIndex: 2, colIndex: 2, name: 'Spider Den',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 50,  y: HUD + 50, w: 60, h: 8 },
    { x: 140, y: HUD + 80, w: 60, h: 8 },
    { x: 220, y: HUD + 50, w: 60, h: 8 },
  ],
  chains: [
    { x: 75,  y: HUD + 20, h: 30 },
    { x: 165, y: HUD + 20, h: 60 },
    { x: 245, y: HUD + 20, h: 30 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 10, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 12, spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
  ],
  dropGaps: [
    { x: 100, w: 120, toRoom: 16, spawnX: 160, spawnY: HUD + 20 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL, 55,  HUD + 30),
    createItem(ITEM_TYPES.JEWEL, 225, HUD + 30),
  ],
  entities: [
    createSpider(75,  HUD + 28, HUD + 28, HUD + 46),
    createSpider(165, HUD + 28, HUD + 28, HUD + 76),
    createSpider(245, HUD + 28, HUD + 28, HUD + 46),
  ],
});

const room_2_3 = buildRoom({
  id: 12, floorIndex: 2, colIndex: 3, name: 'Temple Gate',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 50,  y: HUD + 80, w: 80, h: 8 },
    { x: 190, y: HUD + 50, w: 80, h: 8 },
    { x: 120, y: HUD + 140, w: 80, h: 8 },
  ],
  ladders: [
    { x: 90,  y: HUD + 88, h: 56 },
    { x: 154, y: HUD + 148, h: 56 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 11, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 13, spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
    { x: 152, y: HUD + 20, w: 16, h: 32, color: 'open', toRoom: 6, spawnX: 152, spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.KEY_RED,   195, HUD + 30),
    createItem(ITEM_TYPES.JEWEL,     55,  HUD + 60),
  ],
  entities: [
    createFirePit(130, HUD + PLAY_H - 28, 40),
    createSkull(60, HUD + PLAY_H - 32, 10, 120),
  ],
});

const room_2_4 = buildRoom({
  id: 13, floorIndex: 2, colIndex: 4, name: 'East Descent',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 60,  y: HUD + 70, w: 80, h: 8 },
    { x: 180, y: HUD + 100, w: 80, h: 8 },
  ],
  chains: [
    { x: 95, y: HUD + 20, h: 50 },
    { x: 215, y: HUD + 20, h: 80 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 12, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
  ],
  dropGaps: [
    { x: 100, w: 120, toRoom: 17, spawnX: 160, spawnY: HUD + 20 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL,    185, HUD + 80),
    createItem(ITEM_TYPES.KEY_BLUE, 65,  HUD + 50),
  ],
  entities: [
    createSpider(95,  HUD + 28, HUD + 28, HUD + 66),
    createSpider(215, HUD + 28, HUD + 28, HUD + 96),
    createFirePit(140, HUD + PLAY_H - 28, 30),
  ],
});

// Room connected from room 8 via drop
const room_2_5 = buildRoom({
  id: 14, floorIndex: 2, colIndex: 5, name: 'Far East',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 50, y: HUD + 60, w: 80, h: 8 },
    { x: 180, y: HUD + 90, w: 80, h: 8 },
  ],
  ladders: [
    { x: 85, y: HUD + 68, h: 76 },
  ],
  doors: [
    { x: 8, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 13, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL,  185, HUD + 70),
    createItem(ITEM_TYPES.AMULET, 55,  HUD + 40),
  ],
  entities: [
    createSkull(185, HUD + PLAY_H - 32, 50, 305),
    createFirePit(130, HUD + PLAY_H - 28, 30),
  ],
});

// ─── FLOOR 3 (Bottom) — 6 rooms, center is Treasure Chamber ──────────────────

const room_3_0 = buildRoom({
  id: 15, floorIndex: 3, colIndex: 0, name: 'Crypt West',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 40, y: HUD + 70, w: 80, h: 8 },
    { x: 180, y: HUD + 70, w: 80, h: 8 },
    { x: 120, y: HUD + 140, w: 80, h: 8 },
  ],
  ladders: [
    { x: 75, y: HUD + 78, h: 66 },
    { x: 154, y: HUD + 148, h: 56 },
  ],
  doors: [
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 16, spawnX: 24, spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL,  130, HUD + 120),
    createItem(ITEM_TYPES.TORCH,  45,  HUD + 50),
  ],
  entities: [
    createFirePit(100, HUD + PLAY_H - 28, 30),
    createSkull(185, HUD + PLAY_H - 32, 165, 305),
  ],
});

const room_3_1 = buildRoom({
  id: 16, floorIndex: 3, colIndex: 1, name: 'Crypt Passage',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 50, y: HUD + 80, w: 70, h: 8 },
    { x: 180, y: HUD + 50, w: 70, h: 8 },
  ],
  chains: [
    { x: 85, y: HUD + 20, h: 60 },
    { x: 215, y: HUD + 20, h: 30 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 15, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 17, spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
    // Up to room 11
    { x: 152, y: HUD + 20, w: 16, h: 32, color: 'open', toRoom: 11, spawnX: 160, spawnY: HUD + PLAY_H - 100 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL,   55,  HUD + 60),
    createItem(ITEM_TYPES.KEY_RED, 185, HUD + 30),
  ],
  entities: [
    createSpider(85, HUD + 28, HUD + 28, HUD + 76),
    createSkull(130, HUD + PLAY_H - 32, 10, 305),
  ],
});

const room_3_2 = buildRoom({
  id: 17, floorIndex: 3, colIndex: 2, name: 'Ante-Chamber',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 50,  y: HUD + 60, w: 70, h: 8 },
    { x: 200, y: HUD + 60, w: 70, h: 8 },
    { x: 125, y: HUD + 120, w: 70, h: 8 },
  ],
  ladders: [
    { x: 85, y: HUD + 68, h: 76 },
    { x: 158, y: HUD + 128, h: 76 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 16, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 18, spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
    // Enter Treasure Chamber
    { x: 152, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 19, spawnX: 152, spawnY: HUD + 40 },
    // Up to room 13
    { x: 152, y: HUD + 20, w: 16, h: 32, color: 'open', toRoom: 13, spawnX: 160, spawnY: HUD + PLAY_H - 100 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL, 130, HUD + 100),
    createItem(ITEM_TYPES.JEWEL, 55,  HUD + 40),
  ],
  entities: [
    createFirePit(60, HUD + PLAY_H - 28, 24),
    createFirePit(220, HUD + PLAY_H - 28, 24),
    createSkull(130, HUD + PLAY_H - 32, 10, 305),
  ],
});

const room_3_3 = buildRoom({
  id: 18, floorIndex: 3, colIndex: 3, name: 'Warrior Hall',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 50,  y: HUD + 70, w: 80, h: 8 },
    { x: 190, y: HUD + 90, w: 80, h: 8 },
  ],
  chains: [
    { x: 85,  y: HUD + 20, h: 50 },
    { x: 225, y: HUD + 20, h: 70 },
  ],
  doors: [
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 17, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 19, spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.SWORD,  55,  HUD + 50),
    createItem(ITEM_TYPES.JEWEL,  195, HUD + 70),
  ],
  entities: [
    createSkull(60,  HUD + PLAY_H - 32, 10, 130),
    createSkull(200, HUD + PLAY_H - 32, 165, 305),
    createFirePit(150, HUD + PLAY_H - 28, 30),
  ],
});

// ─── TREASURE CHAMBER (room 19) ──────────────────────────────────────────────

const room_treasure = buildRoom({
  id: 19, floorIndex: 3, colIndex: 4, name: 'Treasure Chamber', isTreasure: true,
  bgColor: '#1a1000',
  platforms: [
    ...walls(),
    ...ground(),
    // Stepped treasure platforms
    { x: 80,  y: HUD + 50,  w: 160, h: 8 },
    { x: 100, y: HUD + 100, w: 120, h: 8 },
    { x: 120, y: HUD + 150, w: 80,  h: 8 },
  ],
  ladders: [
    { x: 154, y: HUD + 58,  h: 48 },
    { x: 154, y: HUD + 108, h: 48 },
    { x: 154, y: HUD + 158, h: 48 },
  ],
  doors: [
    // Exit back up to ante-chamber (allows loop)
    { x: 8,    y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 17, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
    { x: W - 24, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 18, spawnX: 24,     spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL, 100, HUD + 30),
    createItem(ITEM_TYPES.JEWEL, 130, HUD + 30),
    createItem(ITEM_TYPES.JEWEL, 160, HUD + 30),
    createItem(ITEM_TYPES.JEWEL, 190, HUD + 30),
    createItem(ITEM_TYPES.JEWEL, 110, HUD + 80),
    createItem(ITEM_TYPES.JEWEL, 150, HUD + 80),
    createItem(ITEM_TYPES.JEWEL, 125, HUD + 130),
    createItem(ITEM_TYPES.JEWEL, 155, HUD + 130),
    createItem(ITEM_TYPES.AMULET, 152, HUD + 170),
  ],
  entities: [],
});

// ─── Room 20: secret bonus room ─────────────────────────────────────────────

const room_bonus = buildRoom({
  id: 20, floorIndex: 3, colIndex: 5, name: 'Vault Bonus',
  platforms: [
    ...walls(),
    ...ground(),
    { x: 60, y: HUD + 80, w: 80, h: 8 },
    { x: 180, y: HUD + 80, w: 80, h: 8 },
  ],
  ladders: [
    { x: 95, y: HUD + 88, h: 56 },
  ],
  doors: [
    { x: 8, y: HUD + PLAY_H - 48, w: 16, h: 32, color: 'open', toRoom: 19, spawnX: W - 32, spawnY: HUD + PLAY_H - 48 },
  ],
  items: [
    createItem(ITEM_TYPES.JEWEL, 65, HUD + 60),
    createItem(ITEM_TYPES.JEWEL, 185, HUD + 60),
    createItem(ITEM_TYPES.JEWEL, 130, HUD + PLAY_H - 40),
  ],
  entities: [
    createSkull(130, HUD + PLAY_H - 32, 10, 305),
  ],
});

/** All rooms indexed by id */
export const ALL_ROOMS = [
  room_0_0, room_0_1, room_0_2, room_0_3,   // floor 0: ids 0-3
  room_1_0, room_1_1, room_1_2, room_1_3, room_1_4,  // floor 1: ids 4-8
  room_2_0, room_2_1, room_2_2, room_2_3, room_2_4, room_2_5,  // floor 2: ids 9-14
  room_3_0, room_3_1, room_3_2, room_3_3,   // floor 3 outer: ids 15-18
  room_treasure,   // id 19
  room_bonus,      // id 20
];

/** Get a room by id */
export function getRoomById(id) {
  return ALL_ROOMS.find(r => r.id === id) || null;
}

/**
 * Deep-clone a room so each game session gets fresh entity/item state.
 */
export function cloneRoom(room) {
  return {
    ...room,
    items:    room.items.map(i => ({ ...i })),
    entities: room.entities.map(e => ({ ...e })),
  };
}
