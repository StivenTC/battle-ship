import { getSkillAffectedCells, GRID_SIZE } from "@battle-ship/shared";
import type { Game } from "./Game.js";
import type { Player } from "./Player.js";

type SkillImplementation = (
  game: Game,
  attacker: Player,
  opponent: Player,
  target: { x: number; y: number }
) => void;

export const SkillStrategies: Record<string, SkillImplementation> = {
  SCAN_3X3: (_game, attacker, opponent, { x, y }) => {
    const affectedCells = getSkillAffectedCells("SCAN_3X3", x, y);
    for (const cell of affectedCells) {
      const realState = opponent.board.reveal(cell.x, cell.y);
      attacker.reveal(cell.x, cell.y, realState);
    }
  },

  CROSS_DIAGONAL: (_game, attacker, opponent, { x, y }) => {
    const affectedCells = getSkillAffectedCells("CROSS_DIAGONAL", x, y);
    executeAttacks(attacker, opponent, affectedCells);
  },

  GLOBAL_RANDOM_3: (_game, attacker, opponent) => {
    const available: { x: number; y: number }[] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        available.push({ x: i, y: j });
      }
    }
    // Shuffle (Fisher-Yates)
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }
    const affectedCells = available.slice(0, 3);
    executeAttacks(attacker, opponent, affectedCells);
  },

  LINE_RAY: (_game, attacker, opponent, { x }) => {
    const affectedCells: { x: number; y: number }[] = [];
    for (let i = GRID_SIZE - 1; i >= 0; i--) {
      const currentY = i;
      affectedCells.push({ x, y: currentY });

      const state = opponent.board.getCellState(x, currentY);

      if (state === "SHIP" || state === "REVEALED_SHIP") {
        break;
      }

      if (opponent.placedMines.some((m) => m.x === x && m.y === currentY)) {
        break;
      }
    }
    executeAttacks(attacker, opponent, affectedCells);
  },

  SINGLE_REVEAL: (_game, attacker, opponent, { x, y }) => {
    executeAttacks(attacker, opponent, [{ x, y }]);

    const state = opponent.board.getCellState(x, y);
    if (state === "SHIP" || state === "REVEALED_SHIP" || state === "HIT") {
      const hitShip = opponent.ships.find((s) => s.position.some((p) => p.x === x && p.y === y));
      if (hitShip) {
        for (const p of hitShip.position) {
          const pState = opponent.board.reveal(p.x, p.y);
          attacker.reveal(p.x, p.y, pState);
        }
      }
    }
  },
};

// Helper
function executeAttacks(attacker: Player, opponent: Player, targets: { x: number; y: number }[]) {
  for (const h of targets) {
    const outcome = opponent.receiveAttack(h.x, h.y);

    if (outcome.attacks && outcome.attacks.length > 0) {
      for (const atk of outcome.attacks) {
        if (atk.result === "HIT" || atk.result === "SUNK") {
          attacker.addHit(atk.x, atk.y);
        } else if (atk.result === "MISS") {
          attacker.misses.push({ x: atk.x, y: atk.y });
        }
      }
    } else {
      // Fallback for direct attack
      if (outcome.result === "HIT" || outcome.result === "SUNK") {
        attacker.addHit(h.x, h.y);
      } else if (outcome.result === "MISS") {
        attacker.misses.push({ x: h.x, y: h.y });
      }
    }

    if (outcome.mineExploded) {
      attacker.reveal(h.x, h.y, "REVEALED_MINE");
    }
  }
}
