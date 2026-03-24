/**
 * config.js — Tunable constants for Monte Clone
 * All game-wide settings live here so they're easy to tweak.
 */

export const CONFIG = {
  // Internal resolution (upscaled to canvas)
  INTERNAL_WIDTH: 320,
  INTERNAL_HEIGHT: 240,

  // Canvas display scale
  DISPLAY_SCALE: 3,

  // Physics
  GRAVITY: 0.35,
  JUMP_VELOCITY: -7.5,
  PLAYER_SPEED: 1.6,
  CLIMB_SPEED: 1.2,

  // Player
  PLAYER_WIDTH: 14,
  PLAYER_HEIGHT: 20,
  MAX_FALL_SPEED: 9,

  // HUD
  HUD_HEIGHT: 20,

  // Tile size for level grid
  TILE: 16,

  // Pyramid layout
  FLOORS: 4,
  ROOMS_PER_FLOOR: [4, 5, 5, 6],   // floor 0 = top, floor 3 = bottom

  // Scoring
  JEWEL_SCORE: 250,
  KEY_SCORE: 100,
  TREASURE_CHAMBER_BONUS: 5000,

  // Lives
  STARTING_LIVES: 3,

  // Enemy speeds
  SKULL_SPEED: 0.9,
  SPIDER_SPEED: 0.7,

  // Pixel font (loaded via Google Fonts in index.html)
  FONT: "'Press Start 2P', monospace",

  // Colors (sharper retro palette — more contrast, more Aztec)
  COLORS: {
    BG:          '#0d0822',
    BG2:         '#13082e',   // secondary bg for pattern
    WALL:        '#4422aa',
    WALL_LIGHT:  '#9977ee',
    WALL_DARK:   '#220088',
    FLOOR:       '#6644bb',
    FLOOR_LIGHT: '#aa88ff',
    FLOOR_DARK:  '#2211aa',
    LADDER:      '#ffcc00',
    CHAIN:       '#cccccc',
    PLAYER:      '#ff9922',
    PLAYER_SKIN: '#ffcc88',
    SKULL:       '#f0f0f0',
    SKULL_EYE:   '#ff2200',
    SPIDER:      '#00ee44',
    SPIDER_DARK: '#007722',
    FIRE:        '#ff4400',
    FIRE2:       '#ff8800',
    FIRE3:       '#ffcc00',
    DOOR_RED:    '#ee1111',
    DOOR_BLUE:   '#1144ee',
    DOOR_GREEN:  '#11aa33',
    DOOR_OPEN:   '#110d33',
    KEY_RED:     '#ff3333',
    KEY_BLUE:    '#3399ff',
    KEY_GREEN:   '#33ff66',
    JEWEL:       '#ff44ff',
    JEWEL_LIGHT: '#ffaaff',
    TORCH:       '#ffaa22',
    SWORD:       '#ddeeff',
    AMULET:      '#ffdd00',
    HUD_BG:      '#07031a',
    HUD_LINE:    '#331166',
    TEXT:        '#ffffff',
    TEXT_DIM:    '#887799',
    SCORE_TEXT:  '#ffdd66',
    TREASURE:    '#ffd700',
    TREASURE2:   '#ffaa00',
  },
};
