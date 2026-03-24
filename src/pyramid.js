/**
 * pyramid.js — All rooms arranged in pyramid grid/graph + navigation logic
 * Manages the map of rooms and provides helpers for transitions between rooms.
 */

import { ALL_ROOMS, cloneRoom, getRoomById } from './room.js';

/**
 * PyramidMap holds all room instances for the current game session.
 * Each room is deep-cloned so state (collected items etc.) is isolated.
 */
export class PyramidMap {
  constructor() {
    /** @type {Map<number, object>} room id → cloned room object */
    this.rooms = new Map();

    for (const room of ALL_ROOMS) {
      this.rooms.set(room.id, cloneRoom(room));
    }
  }

  /** Get a room by id (returns the live/cloned instance) */
  getRoom(id) {
    return this.rooms.get(id) || null;
  }

  /** Starting room id (top of pyramid) */
  get startRoomId() {
    return 0;
  }

  /**
   * Given a door object and the current room, return the destination room
   * and player spawn position { room, spawnX, spawnY }.
   */
  resolveTransition(door) {
    const destRoom = this.getRoom(door.toRoom);
    if (!destRoom) return null;
    return {
      room:   destRoom,
      spawnX: door.spawnX,
      spawnY: door.spawnY,
    };
  }
}
