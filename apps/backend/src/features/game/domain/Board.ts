import { type CellState, type Coordinates, GRID_SIZE, type ShipType } from "@battle-ship/shared";

interface Cell {
  x: number;
  y: number;
  state: CellState;
  shipId?: string; // If a ship is here
  hasMine: boolean;
}

export class Board {
  private grid: Cell[][];
  private ships: Map<string, { type: ShipType; hits: number; size: number; isSunk: boolean }>;

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

    this.ships.set(id, { type, hits: 0, size, isSunk: false });
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
        const res = this.damageCell(t.x, t.y);
        affected.push(res);
      }
    }

    return affected;
  }

  // Internal helper for direct damage without mine triggering
  private damageCell(x: number, y: number): { result: "HIT" | "MISS" | "SUNK"; shipId?: string } {
    const cell = this.grid[y][x];

    // Propagate existing state if already hit
    if (cell.state === "HIT" || cell.state === "MISS" || cell.state === "REVEALED_MINE") {
      // If it was a ship hit, return that info again?
      // Ideally we don't re-process damage.
      return { result: cell.state === "HIT" ? "HIT" : "MISS" };
    }

    // If it was just revealed but not hit yet?
    // REVEALED_SHIP -> becomes HIT
    // REVEALED_EMPTY -> becomes MISS
    if (cell.state === "REVEALED_SHIP") {
      cell.state = "HIT";
      return this.processShipHit(cell);
    }
    if (cell.state === "REVEALED_EMPTY") {
      cell.state = "MISS";
      return { result: "MISS" };
    }

    if (cell.state === "SHIP" && cell.shipId) {
      cell.state = "HIT";
      return this.processShipHit(cell);
    }

    // Default miss
    cell.state = "MISS";
    return { result: "MISS" };
  }

  private processShipHit(cell: Cell): { result: "HIT" | "SUNK"; shipId?: string } {
    if (!cell.shipId) return { result: "HIT" }; // Should not happen

    const ship = this.ships.get(cell.shipId);
    if (ship) {
      ship.hits++;
      ship.isSunk = ship.hits >= ship.size;
      return { result: ship.isSunk ? "SUNK" : "HIT", shipId: cell.shipId };
    }
    return { result: "HIT", shipId: cell.shipId };
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

      // Update state to reflect exploded mine if it was empty?
      // Or does the explosion turn it into a MISS/HIT?
      // A mine consumes the cell. If there was no ship, it's a "Mine Hit" spot.
      // But we need to return valid CellState.
      // Let's say the center becomes "MISS" visually but we know it was a mine.
      // Actually, if we want to show "Exploded Mine", we might need a specific state or just handling it in frontend.
      // For now, let's treat it as damage.

      const explosionResults = this.triggerMine(x, y);

      // The center result is what matters for the return value
      const centerRes = explosionResults[0];
      return { ...centerRes, mineExploded: true };
    }

    // 2. Normal Attack
    return this.damageCell(x, y);
  }

  // Reveal logic for Scanner
  reveal(x: number, y: number): CellState {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return "MISS"; // Out of bounds

    const cell = this.grid[y][x];

    // If already interacting state, return it
    if (
      ["HIT", "MISS", "SUNK", "REVEALED_MINE", "REVEALED_SHIP", "REVEALED_EMPTY"].includes(
        cell.state
      )
    ) {
      return cell.state;
    }

    // Logic:
    // Mine -> REVEALED_MINE
    // Ship -> REVEALED_SHIP
    // Empty -> REVEALED_EMPTY

    // Prioritize Mine? Yes, a scanner detects the mine.
    if (cell.hasMine) {
      // Do NOT consume mine, just reveal it
      // We can set state to REVEALED_MINE if we want to persist it on board?
      // Or just return it?
      // If we want "Fog of War" to remember it, we should update state.
      // BUT, be careful: if we update state to REVEALED_MINE, can we still attack it?
      // Yes, receiveAttack should handle REVEALED_MINE. (Added to check above)
      cell.state = "REVEALED_MINE";
      return "REVEALED_MINE";
    }

    if (cell.state === "SHIP") {
      cell.state = "REVEALED_SHIP";
      return "REVEALED_SHIP";
    }

    if (cell.state === "EMPTY") {
      cell.state = "REVEALED_EMPTY";
      return "REVEALED_EMPTY";
    }

    return cell.state;
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

    for (const [id, ship] of this.ships) {
      if (ship.type === type) {
        shipIdToRemove = id;
        break;
      }
    }

    if (!shipIdToRemove) return;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.grid[y][x].shipId === shipIdToRemove) {
          this.grid[y][x].state = "EMPTY";
          this.grid[y][x].shipId = undefined;
        }
      }
    }

    this.ships.delete(shipIdToRemove);
  }

  private isValidPlacement(coords: Coordinates[]): boolean {
    for (const { x, y } of coords) {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
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
    return { hits: ship.hits, isSunk: ship.isSunk };
  }

  getCellState(x: number, y: number): CellState {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return "MISS";

    // Explicit return for mined but hidden cells?
    // NO! getCellState is used for "what is here right now".
    // If we want public state, it's different.
    // NOTE: This Board is mostly internal authorized state.
    // However, if we just return this.grid[y][x].state, we are good because:
    // - Mines are hasMine=true but state='EMPTY' until revealed or exploded.
    // - So a normal getCellState() returns 'EMPTY' for a hidden mine. Correct.
    // - Only reveal() or receiveAttack() changes state.

    return this.grid[y][x].state;
  }
}
