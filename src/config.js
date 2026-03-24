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

  // Colors (retro palette)
  COLORS: {
    BG:          '#1a0a2e',
    WALL:        '#5533aa',
    FLOOR:       '#7755cc',
    LADDER:      '#ddaa44',
    CHAIN:       '#aaaaaa',
    PLAYER:      '#ff9944',
    SKULL:       '#ffffff',
    SPIDER:      '#44dd44',
    FIRE:        '#ff4400',
    DOOR_RED:    '#cc2222',
    DOOR_BLUE:   '#2244cc',
    DOOR_GREEN:  '#22aa44',
    KEY_RED:     '#ff4444',
    KEY_BLUE:    '#4488ff',
    KEY_GREEN:   '#44ee66',
    JEWEL:       '#ff66ff',
    TORCH:       '#ffaa22',
    SWORD:       '#ccccff',
    AMULET:      '#ffdd00',
    HUD_BG:      '#0d0620',
    TEXT:        '#ffffff',
    SCORE_TEXT:  '#ffdd88',
    TREASURE:    '#ffd700',
  },
};
