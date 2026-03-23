# Design Notes — Aztec Relic Runner

Scratch-pad for the architecture decisions made during this build.

---

## World Graph

Rooms are connected as a **random spanning tree** (ensures full reachability with a random walk) plus 1–2 extra edges for loop variety. This prevents dead ends while keeping map structure interesting each run.

Door directions are assigned greedily per edge: prefer right → left, fall back to down/up if a wall already has a door. The opposite side of the connecting room gets the matching door so entry/exit always line up logically.

---

## Win Condition Design

Separating **idol collection** from **exit** forces the player to explore rather than beeline to the exit. The idol room is always distinct from both the start and exit rooms (picked from shuffled IDs at generation time).

The EXIT door exists in every room that has an edge pointing to the designated exit room. It renders as teal instead of blue so it's visually distinct, but only triggers victory when `hasIdol === true`. Otherwise the player just passes through normally — no "you need the idol" message to keep it clean.

---

## Physics Notes

- **Platform one-way**: platforms only block from above (checked via `prevBottom <= sb.y + 4` threshold). Players can jump up through them. This is intentional — classic Aztec platformer feel.
- **Ladder override**: when overlapping a ladder, gravity is zeroed and the player gets a separate vertical input axis. Horizontal movement still works on ladders for a natural feel.
- **Delta time cap**: `dt` is capped at 50ms (equiv to ~20 FPS minimum) to prevent tunnelling on tab-unfocus resume.

---

## HUD

Three elements drawn on a semi-transparent 28px top bar:
- **Hearts** (left): filled/hollow pixel hearts, one per `PLAYER_MAX_HEALTH`
- **Score** (centre): monospace, updates live
- **Idol indicator** (right): only appears after collection, golden star + "IDOL"

Kept minimal to leave room viewport uncluttered on the 640×400 canvas.

---

## Rendering

All rendering is direct 2D canvas calls — no sprites, no asset loading. The art style is intentionally lo-fi: rectangles, arcs, and bezier hearts. The archaeologist hat + face indicator on the player gives enough character without needing a spritesheet.

Enemy snakes use an ellipse body + forked tongue that flips based on patrol direction.

---

## Invincibility Frames

After taking damage the player gets `INV_DURATION = 0.8s` of i-frames. During this window the player sprite flickers (alternates visible/invisible at 12Hz). This prevents one spike field from draining all health instantly.

Spike damage and enemy damage have separate cooldowns (`_spikeDmgCd`, `_enemyDmgCd`) in addition to the player's i-frame timer, giving a slightly different feel for each hazard type.

---

## Room Transition

On door contact, the player is teleported to the matching side of the next room (right door → spawn on left side, etc.). A brief white flash (`_flashTimer = 0.18s`) sells the transition without a fade animation, keeping the loop tight.

---

## Possible Extensions

- [ ] Animated torch particles in room corners
- [ ] More enemy types (spear thrower, bat)
- [ ] Locked doors / key collectibles
- [ ] Room type variants (flooded, lava floor)
- [ ] A\* pathfinding enemies that chase player
- [ ] Persistent high-score via `localStorage`
- [ ] Sound effects via Web Audio API (no assets needed)
- [ ] Mobile touch controls overlay
