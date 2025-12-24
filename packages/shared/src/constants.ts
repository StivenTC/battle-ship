export const GRID_SIZE = 8;
export const MAX_AP = 6;
export const STARTING_AP = 1;
export const SHIPS_PER_PLAYER = 3;
export const MINES_PER_PLAYER = 2;

export const SHIP_CONFIG = {
  Carrier: { size: 5, cost: 3, skill: "Drone" }, // Portaviones
  Battleship: { size: 4, cost: 4, skill: "Cluster" }, // Acorazado
  Destroyer: { size: 3, cost: 2, skill: "Double Salvo" }, // Destructor
  Submarine: { size: 3, cost: 3, skill: "Sonar Torpedo" }, // Submarino
  Corvette: { size: 2, cost: 1, skill: "Hit & Run" }, // Corbeta
};
