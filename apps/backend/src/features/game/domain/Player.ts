import {
  type CellState,
  type Coordinates,
  MAX_AP,
  MINES_PER_PLAYER,
  SHIPS_PER_PLAYER,
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
  public hits: Coordinates[];
  public misses: Coordinates[];

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
    if (this.ships.length !== SHIPS_PER_PLAYER || this.placedMines.length !== MINES_PER_PLAYER) {
      throw new Error("Cannot set ready: Fleet not fully deployed");
    }
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

  checkMines(
    opponentMines: Coordinates[]
  ): { x: number; y: number; result: "HIT" | "MISS" | "SUNK"; shipId?: string }[] {
    const events: { x: number; y: number; result: "HIT" | "MISS" | "SUNK"; shipId?: string }[] = [];
    for (const mine of opponentMines) {
      const currentState = this.board.getCellState(mine.x, mine.y);
      if (currentState === "SHIP") {
        const outcome = this.receiveAttack(mine.x, mine.y);

        if (outcome.attacks) {
          events.push(...outcome.attacks);
        } else {
          events.push({
            x: mine.x,
            y: mine.y,
            result: outcome.result as "HIT" | "MISS" | "SUNK",
            shipId: outcome.shipId,
          });
        }
      }
    }
    return events;
  }

  receiveAttack(
    x: number,
    y: number
  ): {
    result: "HIT" | "MISS" | "SUNK";
    shipId?: string;
    mineExploded?: boolean;
    attacks?: { x: number; y: number; result: "HIT" | "MISS" | "SUNK"; shipId?: string }[];
  } {
    const outcome = this.board.receiveAttack(x, y);

    // Sync ships with board state
    if (outcome.mineExploded || (outcome.attacks && outcome.attacks.length > 0)) {
      this.syncShipsWithBoard();
    } else if (outcome.result === "HIT" || outcome.result === "SUNK") {
      if (outcome.shipId) {
        const ship = this.ships.find((s) => s.id === outcome.shipId);
        if (ship) {
          const boardState = this.board.getShipState(ship.id);
          if (boardState) {
            ship.hits = [];

            // Re-sync hits based on board state matching ship position
            // Since we don't have exact hit positions from getShipState, we append the current hit if new
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

  reveal(x: number, y: number, state: CellState) {
    const existing = this.revealedCells.find((c) => c.x === x && c.y === y);
    if (!existing) {
      this.revealedCells.push({ x, y, status: state });
    } else {
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
