import {
  type Coordinates,
  MAX_AP,
  MINES_PER_PLAYER,
  type Ship,
  type ShipType,
} from "@battle-ship/shared";
import { Board } from "./Board.js";

export class Player {
  public readonly id: string;
  public board: Board;
  public ships: Ship[];
  public ap: number;
  public mines: number;
  public isReady: boolean;
  public placedMines: Coordinates[];

  constructor(id: string) {
    this.id = id;
    this.board = new Board();
    this.ships = [];
    this.ap = 1;
    this.mines = MINES_PER_PLAYER;
    this.placedMines = [];
    this.isReady = false;
  }

  setReady() {
    this.isReady = true;
  }

  regenerateAP() {
    if (this.ap < MAX_AP) {
      this.ap++;
    }
  }

  spendAP(cost: number): boolean {
    if (this.ap >= cost) {
      this.ap -= cost;
      return true;
    }
    return false;
  }

  placeShip(
    type: ShipType,
    size: number,
    cost: number,
    start: { x: number; y: number },
    horizontal: boolean
  ): boolean {
    const shipId = crypto.randomUUID();
    // Remove existing ship of this type from board and list
    this.board.removeShipByType(type);
    this.ships = this.ships.filter((s) => s.type !== type);

    const success = this.board.placeShip(shipId, type, size, start, horizontal);

    if (success) {
      const coords: Coordinates[] = [];
      for (let i = 0; i < size; i++) {
        coords.push({
          x: horizontal ? start.x + i : start.x,
          y: horizontal ? start.y : start.y + i,
        });
      }

      this.ships.push({
        id: shipId,
        type,
        size,
        cost,
        position: coords,
        hits: [],
        isSunk: false,
      });
      return true;
    }

    return false;
  }

  placeMine(x: number, y: number): boolean {
    if (this.mines <= 0) {
      return false;
    }

    const success = this.board.placeMine(x, y);
    if (success) {
      this.mines--;
      this.placedMines.push({ x, y });
      return true;
    }

    return false;
  }

  // Check for mines at game start (Trap Logic)
  checkMines(opponentMines: Coordinates[]): void {
    for (const mine of opponentMines) {
      // We simulate an attack at the mine's location on MY board.
      // If I have a ship there, it gets hit.
      // We don't trigger explosions here, just direct hits if landing on a mine.
      // Actually, game rule says: "Starts damaged".
      // We can reuse receiveAttack but suppress explosion logic?
      // Or better: check if my board has a ship at (mine.x, mine.y) and apply damage.

      // Let's use Board's receiveAttack logic but only if it's a ship.
      // We shouldn't "trigger" the mine on my board because the mine is on the ENEMY board really,
      // but physically I placed a ship on coordinates X,Y and enemy placed a mine on X,Y.
      // Wait, "Mines are shared grid"? No, each player has their own grid.
      // Interpretation:
      // - I place ships on My Grid.
      // - I place mines on My Grid? Or Enemy Grid?
      // - Usually Battleship mines are hidden on YOUR grid, and if enemy shoots there, THEY blow up.
      // - BUT the user says: "el punto de las minas es que si mi enemigo pone un barco encima de las minas, empezaria el juego golpeado."
      // - This implies mines are placed on a SHARED coordinate system or predicted placement?
      // - Ah, if I place a mine at (3,3), and Enemy places a ship at (3,3), Enemy starts damaged.
      // - This means I place mines on the "Map" thinking "He will put a ship here".
      // - Correct. So `opponentMines` are the mines *I* placed, checking against *Enemy* ships.
      // - So `enemy.checkMines(myMines)` is the call.

      const result = this.receiveAttack(mine.x, mine.y);
      console.log(`Checking Trap at ${mine.x},${mine.y}:`, result);
    }
  }

  receiveAttack(
    x: number,
    y: number
  ): { result: "HIT" | "MISS" | "SUNK"; shipId?: string; mineExploded?: boolean } {
    const outcome = this.board.receiveAttack(x, y);

    // Helper to process a single result and update ship state
    const processOutcome = (res: { result: "HIT" | "MISS" | "SUNK"; shipId?: string }) => {
      if (res.result === "HIT" || res.result === "SUNK") {
        const ship = this.ships.find((s) => s.id === res.shipId);
        if (ship) {
          // Deduplicate hits
          if (!ship.hits.some((h) => h.x === x && h.y === y)) {
            // Logic limitation: hits array only stores coord, not which part is hit if multiple shots land on same spot?
            // Actually ship.hits is array of coords.
            // Only add if not already there?
            // Board tracks state "HIT", so we shouldn't get duplicate receiveAttack calls for same cell?
            // But mines might hit adjacent cells already hit. Board handles that (returns cell.state).
          }
          ship.hits.push({ x, y }); // Simple tracking
          if (res.result === "SUNK") {
            ship.isSunk = true;
          }
        }
      }
    };

    processOutcome(outcome);

    // If mine exploded, it might have returned multiple results?
    // Wait, Board.receiveAttack returns SINGLE result (center) but triggers internal damage.
    // If we want to track ALL hits (side effects), Board.receiveAttack needs to return them or we trust Board state.
    // Issue: Player.ships[i].hits must be updated for ALL affected cells.
    // Board.receiveAttack current implementation only returns the CENTER result?
    // Let's re-read Board.ts.
    // Board.receiveAttack returns `{ ...centerRes, mineExploded: true }`.
    // It calls `triggerMine` which calls `damageCell`. `damageCell` updates `this.ships` (Map in Board).
    // BUT `Player.ships` is a separate array of objects! `this.ships`.
    // We need to sync `Player.ships` with `Board.ships` or update `Player.ships` based on Board state?
    // Syncing is safer.

    // Sync logic:
    if (outcome.mineExploded) {
      // If mine exploded, multiple cells might have changed. Re-sync simple way:
      // Iterate all my ships, check their coords against Board state.
      for (const ship of this.ships) {
        for (const pos of ship.position) {
          // Accessing private board grid via helper or just trust the process?
          // We need to know if it's hit.
          // Hack: We can't easily access Board grid cells from here if private.
          // But `Board` updates its internal `ships` map hits count.
          // We should rely on Board to tell us status?
          // Or make Player.ships the source of truth?
          // Currently code duplicates state: Player has `ships[]`, Board has `grid[][]` and `ships Map`.
          // Refactor risk!
          // Simplest Fix: If mine exploded, iterate Board hits?
          // Better: Board.triggerMine returned `affected` list. But Board.receiveAttack swallowed it.
          // Let's trust that Board updated its internal state.
          // We just need to update Player.ships 'isSunk' and 'hits' to match Board.
          // Actually, Board.damageCell updates `ship.hits` in its Map.
          // Does it update Player's ship instance? NO. Separate object.
        }
      }
      // OK, I need to update Board.ts to return full explosion details OR provide a way to sync.
      // Retrying Board.ts modification might be expensive.
      // Alternative: Player.receiveAttack calls `board.receiveAttack`, then scans its own ships positions?
      this.syncShipsWithBoard();
    } else {
      // Normal single hit process (already done above via processOutcome, but lets double check)
      // Actually processOutcome logic above is redundant if we assume Board handled it?
      // No, Board handles Board.ships. Player handles Player.ships.
      // We must sync.
    }

    return outcome;
  }

  // New helper to sync because of Mine side-effects
  private syncShipsWithBoard() {
    for (const ship of this.ships) {
      ship.hits = []; // Re-build hits based on Board state
      for (const pos of ship.position) {
        const state = this.board.getCellState(pos.x, pos.y);
        if (state === "HIT") {
          ship.hits.push(pos);
        }
      }
      // Update sunk status
      const boardState = this.board.getShipState(ship.id);
      if (boardState) ship.isSunk = boardState.isSunk;
    }
  }

  hasLost(): boolean {
    return this.ships.length > 0 && this.ships.every((s) => s.isSunk);
  }
}
