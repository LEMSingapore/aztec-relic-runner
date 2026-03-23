// config.js — tunable game constants

export const CONFIG = {
  // Canvas
  CANVAS_WIDTH: 640,
  CANVAS_HEIGHT: 400,

  // World generation
  ROOM_COUNT: 8,
  TRAP_DENSITY: 0.25,   // probability a platform edge spawns spikes
  ENEMY_DENSITY: 0.4,   // probability an enemy spawns per room

  // Player
  PLAYER_MAX_HEALTH: 3,
  PLAYER_SPEED: 160,     // px/s horizontal
  PLAYER_JUMP_VEL: -340, // px/s upward
  PLAYER_WIDTH: 20,
  PLAYER_HEIGHT: 28,
  GRAVITY: 800,          // px/s²
  CLIMB_SPEED: 90,       // px/s on ladder

  // Enemy (snake)
  SNAKE_SPEED: 60,       // px/s
  SNAKE_WIDTH: 22,
  SNAKE_HEIGHT: 14,

  // Traps
  SPIKE_WIDTH: 16,
  SPIKE_HEIGHT: 10,
  SPIKE_DAMAGE: 1,

  // Treasure
  TREASURE_SCORE: 50,
  IDOL_SCORE: 500,

  // Physics
  MAX_FALL_SPEED: 600,

  // Tile
  TILE: 32,              // tile size for platforms/ladders

  // Room
  ROOM_W: 640,
  ROOM_H: 400,

  // Colours (palette)
  COL: {
    BG:        '#1a1008',
    FLOOR:     '#7a5c2e',
    PLATFORM:  '#8c6a38',
    LADDER:    '#c8a040',
    PLAYER:    '#f0d060',
    SNAKE:     '#30b030',
    SPIKE:     '#cc3333',
    TREASURE:  '#ffd700',
    IDOL:      '#ff9900',
    DOOR:      '#4080c0',
    HUD_BG:    'rgba(0,0,0,0.55)',
    WIN:       '#40ff80',
    LOSE:      '#ff4040',
    TEXT:      '#ffffff',
    HEART_ON:  '#ff3333',
    HEART_OFF: '#553333',
    EXIT_DOOR: '#00ffcc',
  },
};
