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

export type CellState =
  | "EMPTY"
  | "SHIP"
  | "HIT"
  | "MISS"
  | "REVEALED"
  | "REVEALED_SHIP"
  | "REVEALED_EMPTY"
  | "REVEALED_MINE";

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
  remainingMines: number;
  placedMines: Coordinates[];
  misses: Coordinates[];
  revealedCells: Coordinates[];
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
  PLAYER_READY = "player_ready",
  ATTACK = "attack",
  USE_SKILL = "use_skill", // New
  GAME_STATE = "game_state",
  ERROR = "error",
}

export type SkillName =
  | "DRONE_RECON"
  | "X_IMPACT"
  | "CHAOTIC_SALVO"
  | "SONAR_TORPEDO"
  | "REVEALING_SHOT";

export interface SkillConfig {
  id: SkillName;
  displayName: string;
  description: string;
  cost: number;
  pattern: "SCAN_3X3" | "CROSS_DIAGONAL" | "GLOBAL_RANDOM_3" | "LINE_RAY" | "SINGLE_REVEAL";
  linkedShip: ShipType;
}

export const SKILLS: Record<SkillName, SkillConfig> = {
  DRONE_RECON: {
    id: "DRONE_RECON",
    displayName: "📡 Dron Recon (3)",
    description: "Revela área 3x3 (Sin daño)",
    cost: 3,
    pattern: "SCAN_3X3",
    linkedShip: ShipType.Carrier,
  },
  X_IMPACT: {
    id: "X_IMPACT",
    displayName: "❌ Impacto Cruzado (4)",
    description: "Daño en X (Centro + 4 Diagonales)",
    cost: 4,
    pattern: "CROSS_DIAGONAL",
    linkedShip: ShipType.Battleship,
  },
  CHAOTIC_SALVO: {
    id: "CHAOTIC_SALVO",
    displayName: "💣 Bombardeo (3)",
    description: "3 disparos aleatorios globales",
    cost: 3,
    pattern: "GLOBAL_RANDOM_3",
    linkedShip: ShipType.Destroyer,
  },
  SONAR_TORPEDO: {
    id: "SONAR_TORPEDO",
    displayName: "🌊 Torpedo (3)",
    description: "Línea recta desde borde hasta impacto",
    cost: 3,
    pattern: "LINE_RAY",
    linkedShip: ShipType.Submarine,
  },
  REVEALING_SHOT: {
    id: "REVEALING_SHOT",
    displayName: "📍 Baliza (2)",
    description: "1x1. Si impacta, revela todo el barco",
    cost: 2,
    pattern: "SINGLE_REVEAL",
    linkedShip: ShipType.Corvette,
  },
};

export interface UseSkillDto {
  playerId: string;
  skillName: SkillName;
  target?: { x: number; y: number };
}

export interface CreateGameDto {
  playerId: string;
}

export interface JoinGameDto {
  playerId: string;
  gameId?: string;
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
