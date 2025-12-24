export enum ShipType {
  Carrier = "Carrier", // Portaviones
  Battleship = "Battleship", // Acorazado
  Destroyer = "Destroyer", // Destructor
  Submarine = "Submarine", // Submarino
  Corvette = "Corvette", // Corbeta
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Ship {
  id: string;
  type: ShipType;
  size: number;
  cost: number;
  position: Coordinates[];
  hits: Coordinates[];
  isSunk: boolean;
}

export interface Player {
  id: string;
  name: string;
  ships: Ship[];
  mines: Coordinates[];
  ap: number;
  isReady: boolean;
  isConnected: boolean;
}

export enum GameStatus {
  Waiting = "Waiting",
  Placement = "Placement",
  Combat = "Combat",
  Finished = "Finished",
}

export interface GameState {
  id: string;
  status: GameStatus;
  players: Record<string, Player>;
  turn: string;
  turnCount: number;
  winner?: string;
}
