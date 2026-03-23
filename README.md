# Aztec Relic Runner

A vanilla-JS platformer set deep inside an Aztec tomb.  
Explore procedurally-generated rooms, collect the golden idol, and make it to the exit alive.

## Play

```
open index.html
# or
npx serve .
```

No build step. No external dependencies. Pure ES modules.

## Controls

| Action           | Keys                    |
|------------------|-------------------------|
| Move left/right  | `←` `→`  or  `A` `D`   |
| Jump             | `Space`, `W`, or `↑`   |
| Climb ladder     | `↑` / `↓`  or  `W` / `S` |
| Restart (death/win) | `R`                  |

## Objective

1. **Find the golden idol** — it's in a random room. Walk into it to collect it.  
2. **Reach the EXIT door** (teal/cyan) — it leads out of the tomb.  
3. Collect as many coins (💛) as you can along the way for bonus score.

## How to Win / Lose

- **Win** → collected the idol **and** stepped through the EXIT door.  
- **Lose** → ran out of ❤️ hearts from spikes or snake bites.

## Rooms & World

- 8 procedurally-generated rooms connected as a spanning tree with loop edges.  
- Each room has randomised platforms, ladders, spike traps, and patrol snakes.  
- Doors on the left/right walls transition between rooms.  
- The EXIT door is highlighted in teal and only wins the game once you have the idol.

## Project Structure

```
aztec-relic-runner/
├── index.html          ← open this
├── README.md
├── DESIGN_NOTES.md
└── src/
    ├── config.js       ← all tunable constants
    ├── main.js         ← entry point + rAF loop
    ├── game.js         ← Game class: state, HUD, overlays
    ├── player.js       ← Player: physics, input, rendering
    ├── world.js        ← World: room graph generation
    ├── room.js         ← Room: layout, platforms, ladders, doors
    ├── enemy.js        ← Snake patrol enemy
    └── trap.js         ← Spike trap + AABB helper
```

## Tweaking

Everything lives in `src/config.js`:
- `ROOM_COUNT` — number of rooms (default 8)
- `TRAP_DENSITY` — how spikey rooms are (0–1)
- `ENEMY_DENSITY` — snake spawn probability (0–1)
- `PLAYER_SPEED`, `PLAYER_JUMP_VEL`, `GRAVITY` — feel tuning
