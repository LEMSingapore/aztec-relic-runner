// world.js — Room graph generation and connectivity

import { CONFIG } from './config.js';
import { Room } from './room.js';

/**
 * World holds all rooms and the graph of connections between them.
 * Generation algorithm:
 *  1. Create N Room objects (one is start, one idol, one exit).
 *  2. Build a random spanning tree using a random walk so all rooms are reachable.
 *  3. Add a few extra random edges for loops.
 *  4. Assign door directions based on the graph edges.
 */
export class World {
  constructor() {
    /** @type {Map<number, Room>} */
    this.rooms = new Map();
    /** @type {number} */
    this.startRoomId = 0;
    /** @type {number[]} — adjacency list as pairs */
    this._edges = []; // [ [a,b], ... ]

    this._generate();
  }

  _generate() {
    const n = CONFIG.ROOM_COUNT;

    // Pick special rooms
    const ids = shuffle(Array.from({ length: n }, (_, i) => i));
    const startId = ids[0];
    const idolId  = ids[1];
    const exitId  = ids[2];

    this.startRoomId = startId;

    // Create room objects
    for (let i = 0; i < n; i++) {
      const r = new Room(
        i,
        i === startId,
        i === idolId,
        i === exitId,
      );
      this.rooms.set(i, r);
    }

    // Build spanning tree via random walk (ensures full connectivity)
    const visited = new Set([startId]);
    const unvisited = new Set(ids.filter(x => x !== startId));
    let current = startId;

    while (unvisited.size > 0) {
      const next = randFrom([...unvisited]);
      // walk: connect current → next
      this._addEdge(current, next);
      visited.add(next);
      unvisited.delete(next);
      current = next;
    }

    // Add 1-2 extra edges for loops
    const extraEdges = 2;
    for (let i = 0; i < extraEdges; i++) {
      const a = randFrom(ids);
      let b = randFrom(ids);
      if (b === a) continue;
      if (this._hasEdge(a, b)) continue;
      this._addEdge(a, b);
    }

    // Assign door directions and update room door lists
    this._assignDoors(exitId);
  }

  _addEdge(a, b) {
    if (this._hasEdge(a, b)) return;
    this._edges.push([a, b]);
  }

  _hasEdge(a, b) {
    return this._edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  }

  /**
   * For each edge, pick a side for the door.
   * We alternate left/right so adjacent doors are on opposite walls.
   */
  _assignDoors(exitId) {
    // each room has a counter tracking how many doors it has per side
    const sideCounts = new Map();
    for (const id of this.rooms.keys()) {
      sideCounts.set(id, { left: 0, right: 0, up: 0, down: 0 });
    }

    const oppositeSide = { left: 'right', right: 'left', up: 'down', down: 'up' };

    for (const [a, b] of this._edges) {
      const sc = sideCounts.get(a);
      // prefer left/right doors; fall back to up/down if walls are crowded
      let sideA;
      if (sc.right === 0) sideA = 'right';
      else if (sc.left === 0) sideA = 'left';
      else if (sc.down === 0) sideA = 'down';
      else sideA = 'up';

      const sideB = oppositeSide[sideA];

      const isExitDoor = (b === exitId);
      const isExitDoorBack = (a === exitId);

      this.rooms.get(a).addDoor(sideA, b, isExitDoor);
      this.rooms.get(b).addDoor(sideB, a, isExitDoorBack);

      sideCounts.get(a)[sideA]++;
      sideCounts.get(b)[sideB]++;
    }
  }

  getRoom(id) {
    return this.rooms.get(id);
  }

  get startRoom() {
    return this.rooms.get(this.startRoomId);
  }
}

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
