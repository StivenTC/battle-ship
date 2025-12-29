import {
  type CellState,
  type Coordinates,
  MAX_AP,
  MINES_PER_PLAYER,
  type Ship,
  type ShipType,
} from "@battle-ship/shared";
import { Board } from "./Board.js";

export interface RevealedCell extends Coordinates {
  status: CellState;
}

export class Player {
  public readonly id: string;
  public board: Board;
  public ships: Ship[];
  public ap: number;
  public mines: number;
  public isReady: boolean;
  public placedMines: Coordinates[];
  public revealedCells: RevealedCell[];
  public hits: Coordinates[]; // Tracks shots fired by this player at opponent
  public misses: Coordinates[]; // Tracks shots fired by this player that missed

  constructor(id: string) {
    this.id = id;
    this.board = new Board();
    this.ships = [];
    this.ap = 1;
    this.mines = MINES_PER_PLAYER;
    this.placedMines = [];
    this.revealedCells = [];
    this.hits = [];
    this.misses = [];
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

  checkMines(opponentMines: Coordinates[]): void {
    for (const mine of opponentMines) {
      const currentState = this.board.getCellState(mine.x, mine.y);
      if (currentState === "SHIP") {
        const result = this.receiveAttack(mine.x, mine.y);
        console.log(`Trap Hit at ${mine.x},${mine.y}!`, result);
      }
    }
  }

  receiveAttack(
    x: number,
    y: number
  ): { result: "HIT" | "MISS" | "SUNK"; shipId?: string; mineExploded?: boolean } {
    const outcome = this.board.receiveAttack(x, y);

    // Sync ships with board state, especially important if mine exploded multiple cells
    if (outcome.mineExploded) {
      this.syncShipsWithBoard();
    } else if (outcome.result === "HIT" || outcome.result === "SUNK") {
      // Optimization: For single hit, just update specific ship?
      // But safer to just sync simplisticly if getting ship from ID.
      if (outcome.shipId) {
        const ship = this.ships.find((s) => s.id === outcome.shipId);
        if (ship) {
          const boardState = this.board.getShipState(ship.id);
          if (boardState) {
            ship.hits = []; // Re-calc hits? Or just push?
            // Board.getShipState only returns counts.
            // We need positions.
            // Simplest is to trust Board has updated correct cell state.
            // Update local ship hits array:
            if (!ship.hits.some((h) => h.x === x && h.y === y)) {
              ship.hits.push({ x, y });
            }
            ship.isSunk = boardState.isSunk;
          }
        }
      }
    }

    return outcome;
  }

  // Reveal logic now stores STATUS
  // This is used when *I* am revealed by opponent? No.
  // This function `reveal` is called on the VICTIM to register they are revealed?
  // NO! `revealedCells` are cells I HAVE REVEALED on the ENEMY map.
  // UseSkill calls `opponent.reveal()`.
  // Wait. `Game.ts` calls `opponent.reveal()`.
  // Does `opponent` store what *he* has revealed? Or what *has been revealed of him*?
  // "revealedCells" in GameState usually means "What I can see of the enemy".
  // SO logic: Player 1 has `revealedCells` -> These are cells on Player 2's board that P1 can see.
  // CORRECT.

  // So: `reveal(x, y, actualStateOfEnemyCell)`
  reveal(x: number, y: number, state: CellState) {
    const existing = this.revealedCells.find((c) => c.x === x && c.y === y);
    if (!existing) {
      this.revealedCells.push({ x, y, status: state });
    } else {
      // Update status if changed (e.g. was EMPTY now REVEALED_MINE?)
      // Or strictly strictly overwrite
      existing.status = state;
    }
  }

  addHit(x: number, y: number) {
    if (!this.hits.some((h) => h.x === x && h.y === y)) {
      this.hits.push({ x, y });
    }
  }

  private syncShipsWithBoard() {
    for (const ship of this.ships) {
      ship.hits = [];
      for (const pos of ship.position) {
        const state = this.board.getCellState(pos.x, pos.y);
        // If board says HIT or REVEALED_SHIP (if that counts as hit? No, REVEALED is just visible)
        // Only HIT counts for damage.
        if (state === "HIT") {
          ship.hits.push(pos);
        }
      }
      const boardState = this.board.getShipState(ship.id);
      if (boardState) ship.isSunk = boardState.isSunk;
    }
  }

  hasLost(): boolean {
    return this.ships.length > 0 && this.ships.every((s) => s.isSunk);
  }
}
