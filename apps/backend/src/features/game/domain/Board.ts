import { type Coordinates, GRID_SIZE, type ShipType } from "@battle-ship/shared";

export type CellState = "EMPTY" | "SHIP" | "HIT" | "MISS";

export interface Cell {
  x: number;
  y: number;
  state: CellState;
  shipId?: string; // If a ship is here
  hasMine: boolean;
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
        row.push({ x, y, state: "EMPTY", hasMine: false });
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

  placeMine(x: number, y: number): boolean {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return false;
    }

    // Check overlap: No mine already, and NO SHIP
    if (this.grid[y][x].hasMine || this.grid[y][x].state !== "EMPTY") {
      return false;
    }

    this.grid[y][x].hasMine = true;
    return true;
  }

  triggerMine(x: number, y: number): { result: "HIT" | "MISS" | "SUNK"; shipId?: string }[] {
    const affected: { result: "HIT" | "MISS" | "SUNK"; shipId?: string }[] = [];

    // Cross pattern: Center, Up, Down, Left, Right
    const targets = [
      { x, y },
      { x: x, y: y - 1 },
      { x: x, y: y + 1 },
      { x: x - 1, y: y },
      { x: x + 1, y: y },
    ];

    console.log(`Mine Triggered at ${x},${y}. Exploding targets:`, targets);

    for (const t of targets) {
      // Bounds check for explosion
      if (t.x >= 0 && t.x < GRID_SIZE && t.y >= 0 && t.y < GRID_SIZE) {
        // Recursive attack, but bypass mine check to avoid infinite loops if mines are adjacent
        // Actually, mines normally chain-react. For simplicity here, just damage the cell.
        const res = this.damageCell(t.x, t.y);
        affected.push(res);
      }
    }

    return affected;
  }

  // Internal helper for direct damage without mine triggering
  private damageCell(x: number, y: number): { result: "HIT" | "MISS" | "SUNK"; shipId?: string } {
    const cell = this.grid[y][x];

    if (cell.state === "HIT" || cell.state === "MISS") {
      return { result: cell.state };
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

  receiveAttack(
    x: number,
    y: number
  ): { result: "HIT" | "MISS" | "SUNK"; shipId?: string; mineExploded?: boolean } {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return { result: "MISS" };
    }

    const cell = this.grid[y][x];

    // 1. Check Mine
    if (cell.hasMine) {
      console.log(`Mine found at ${x},${y}! BOOM!`);
      cell.hasMine = false; // Consume mine
      // Trigger Explosion
      const explosionResults = this.triggerMine(x, y);

      // Determine primary result based on center cell
      // If center was a ship, it's a HIT/SUNK. Else it's a MISS (but with explosion side effects)
      // The frontend needs to know it was a mine to show animation.
      const centerRes = explosionResults[0];
      return { ...centerRes, mineExploded: true };
    }

    // 2. Normal Attack
    return this.damageCell(x, y);
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

  removeShipByType(type: ShipType): void {
    let shipIdToRemove: string | undefined;

    // Find ship ID by type
    for (const [id, ship] of this.ships) {
      if (ship.type === type) {
        shipIdToRemove = id;
        break;
      }
    }

    if (!shipIdToRemove) return;

    // Clear cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.grid[y][x].shipId === shipIdToRemove) {
          this.grid[y][x].state = "EMPTY";
          this.grid[y][x].shipId = undefined;
        }
      }
    }

    // Remove from map
    this.ships.delete(shipIdToRemove);
  }

  private isValidPlacement(coords: Coordinates[]): boolean {
    for (const { x, y } of coords) {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
      // Cannot place on non-empty cell OR existing mine
      if (this.grid[y][x].state !== "EMPTY" || this.grid[y][x].hasMine) return false;
    }
    return true;
  }

  getMisses(): Coordinates[] {
    const misses: Coordinates[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.grid[y][x].state === "MISS") {
          misses.push({ x, y });
        }
      }
    }
    return misses;
  }

  getShipState(id: string): { hits: number; isSunk: boolean } | undefined {
    const ship = this.ships.get(id);
    if (!ship) return undefined;
    return { hits: ship.hits, isSunk: ship.hits >= ship.size };
  }

  getCellState(x: number, y: number): CellState {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return "MISS";
    return this.grid[y][x].state;
  }
}
