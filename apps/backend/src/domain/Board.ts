import { type Coordinates, GRID_SIZE, type ShipType } from "@battle-ship/shared";

export type CellState = "EMPTY" | "SHIP" | "HIT" | "MISS";

export interface Cell {
  x: number;
  y: number;
  state: CellState;
  shipId?: string; // If a ship is here
}

export class Board {
  private grid: Cell[][];
  private ships: Map<string, { type: ShipType; hits: number; size: number }>;

  constructor() {
    this.grid = this.initializeGrid();
    this.ships = new Map();
  }

  private initializeGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({ x, y, state: "EMPTY" });
      }
      grid.push(row);
    }
    return grid;
  }

  // Place a ship on the grid
  placeShip(
    id: string,
    type: ShipType,
    size: number,
    start: Coordinates,
    horizontal: boolean
  ): boolean {
    const coords = this.getShipCoordinates(start, size, horizontal);

    if (!this.isValidPlacement(coords)) {
      return false;
    }

    for (const { x, y } of coords) {
      this.grid[y][x].state = "SHIP";
      this.grid[y][x].shipId = id;
    }

    this.ships.set(id, { type, hits: 0, size });
    return true;
  }

  receiveAttack(x: number, y: number): { result: "HIT" | "MISS" | "SUNK"; shipId?: string } {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return { result: "MISS" }; // Out of bounds treated as miss
    }

    const cell = this.grid[y][x];

    if (cell.state === "HIT" || cell.state === "MISS") {
      return { result: cell.state }; // Already attacked
    }

    if (cell.state === "SHIP" && cell.shipId) {
      cell.state = "HIT";
      const ship = this.ships.get(cell.shipId);
      if (ship) {
        ship.hits++;
        const isSunk = ship.hits >= ship.size;
        return { result: isSunk ? "SUNK" : "HIT", shipId: cell.shipId };
      }
    }

    cell.state = "MISS";
    return { result: "MISS" };
  }

  private getShipCoordinates(start: Coordinates, size: number, horizontal: boolean): Coordinates[] {
    const coords: Coordinates[] = [];
    for (let i = 0; i < size; i++) {
      coords.push({
        x: horizontal ? start.x + i : start.x,
        y: horizontal ? start.y : start.y + i,
      });
    }
    return coords;
  }

  private isValidPlacement(coords: Coordinates[]): boolean {
    for (const { x, y } of coords) {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
      if (this.grid[y][x].state !== "EMPTY") return false;
    }
    return true;
  }
}
