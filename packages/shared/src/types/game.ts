export enum ShipType {
  Carrier = "Carrier", // Portaviones
  Battleship = "Battleship", // Acorazado
  Destroyer = "Destroyer", // Destructor
  Submarine = "Submarine", // Submarino
  Corvette = "Corvette", // Corbeta
}

export const SHIP_NAMES_ES: Record<ShipType, string> = {
  [ShipType.Carrier]: "Portaviones",
  [ShipType.Battleship]: "Acorazado",
  [ShipType.Destroyer]: "Destructor",
  [ShipType.Submarine]: "Submarino",
  [ShipType.Corvette]: "Corbeta",
};

export type CellState = "EMPTY" | "SHIP" | "HIT" | "MISS";

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

export enum GameEvents {
  CREATE_GAME = "create_game",
  JOIN_GAME = "join_game",
  LEAVE_GAME = "leave_game",
  PLACE_SHIP = "place_ship",
  PLACE_MINE = "place_mine",
  ATTACK = "attack",
  GAME_STATE = "game_state",
  ERROR = "error",
}

export interface JoinGameDto {
  playerId: string;
}

export interface PlaceShipDto {
  playerId: string;
  type: ShipType;
  size: number;
  start: Coordinates;
  horizontal: boolean;
}

export interface PlaceMineDto {
  playerId: string;
  x: number;
  y: number;
}

export interface AttackDto {
  playerId: string;
  x: number;
  y: number;
}
