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

  receiveAttack(x: number, y: number): { result: "HIT" | "MISS" | "SUNK"; shipId?: string } {
    const outcome = this.board.receiveAttack(x, y);

    if (outcome.result === "HIT" || outcome.result === "SUNK") {
      const ship = this.ships.find((s) => s.id === outcome.shipId);
      if (ship) {
        ship.hits.push({ x, y });
        if (outcome.result === "SUNK") {
          ship.isSunk = true;
        }
      }
    }

    return outcome;
  }

  hasLost(): boolean {
    return this.ships.length > 0 && this.ships.every((s) => s.isSunk);
  }
}
