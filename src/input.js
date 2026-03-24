/**
 * input.js — Keyboard input handling
 * Tracks pressed keys and provides a clean API for the game to poll.
 * No globals; export a singleton InputManager instance.
 */

class InputManager {
  constructor() {
    this._keys = new Set();
    this._justPressed = new Set();
    this._justReleased = new Set();

    window.addEventListener('keydown', (e) => {
      if (!this._keys.has(e.code)) {
        this._justPressed.add(e.code);
      }
      this._keys.add(e.code);
      // Prevent arrow key scrolling
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code);
      this._justReleased.add(e.code);
    });
  }

  /** Returns true while the key is held down */
  isDown(code) {
    return this._keys.has(code);
  }

  /** Returns true only on the first frame the key was pressed */
  wasPressed(code) {
    return this._justPressed.has(code);
  }

  /** Returns true only on the first frame the key was released */
  wasReleased(code) {
    return this._justReleased.has(code);
  }

  /** Call once at end of each frame to clear per-frame sets */
  flush() {
    this._justPressed.clear();
    this._justReleased.clear();
  }

  // Convenience helpers for game actions
  get left()    { return this.isDown('ArrowLeft')  || this.isDown('KeyA'); }
  get right()   { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
  get up()      { return this.isDown('ArrowUp')    || this.isDown('KeyW'); }
  get down()    { return this.isDown('ArrowDown')  || this.isDown('KeyS'); }
  get jumpPressed() {
    return this.wasPressed('Space') || this.wasPressed('KeyK');
  }
  get restartPressed() {
    return this.wasPressed('Enter') || this.wasPressed('KeyR');
  }
}

export const input = new InputManager();
