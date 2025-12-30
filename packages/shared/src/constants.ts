export const GRID_SIZE = 6;
export const MAX_AP = 6;
export const STARTING_AP = 1;
export const SHIPS_PER_PLAYER = 3;
export const MINES_PER_PLAYER = 2;

export const SHIP_CONFIG = {
  Carrier: { size: 5, cost: 3, skill: "Dron Recon" }, // Portaviones (Balanced)
  Battleship: { size: 4, cost: 4, skill: "Impacto Cruzado" }, // Acorazado (High Damage = High Cost)
  Destroyer: { size: 3, cost: 3, skill: "Bombardeo" }, // Destructor (3 Random Hits)
  Submarine: { size: 3, cost: 4, skill: "Torpedo" }, // Submarino (Effective Sniping)
  Corvette: { size: 2, cost: 2, skill: "Baliza" }, // Corbeta (Info shouldn't be free)
};
