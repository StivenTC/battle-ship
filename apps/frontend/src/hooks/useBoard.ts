import {
  type Coordinates,
  GRID_SIZE,
  SHIP_CONFIG,
  type Ship,
  type ShipType,
} from "@battle-ship/shared";
import { useState } from "react";

export interface BoardState {
  ships: Ship[];
  placedMines: Coordinates[];
  selection: {
    type: ShipType | null;
    isVertical: boolean;
  };
  hoverCell: Coordinates | null;
}

export const useBoard = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [placedMines, setPlacedMines] = useState<Coordinates[]>([]);
  const [selection, setSelection] = useState<{
    type: ShipType | null;
    isVertical: boolean;
  }>({ type: null, isVertical: false });
  const [hoverCell, setHoverCell] = useState<Coordinates | null>(null);

  const selectShipType = (type: ShipType) => {
    setSelection((prev) => ({ ...prev, type }));
  };

  const toggleOrientation = () => {
    setSelection((prev) => ({ ...prev, isVertical: !prev.isVertical }));
  };

  const isValidPlacement = (start: Coordinates, size: number, vertical: boolean): boolean => {
    const positions: Coordinates[] = [];
    for (let i = 0; i < size; i++) {
      const x = vertical ? start.x : start.x + i;
      const y = vertical ? start.y + i : start.y;

      // Check bounds
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
        return false;
      }
      positions.push({ x, y });
    }

    // Check overlap with existing ships
    for (const ship of ships) {
      for (const pos of ship.position) {
        for (const newPos of positions) {
          if (pos.x === newPos.x && pos.y === newPos.y) {
            console.warn("Invalid placement: Overlap detected at", pos);
            return false;
          }
        }
      }
    }

    return true;
  };

  const placeShip = (x: number, y: number) => {
    if (!selection.type) return;

    const config = SHIP_CONFIG[selection.type];
    if (!isValidPlacement({ x, y }, config.size, selection.isVertical)) {
      return; // Invalid placement visual feedback handled by UI
    }

    const newShip: Ship = {
      id: crypto.randomUUID(),
      type: selection.type,
      size: config.size,
      cost: config.cost,
      hits: [],
      isSunk: false,
      position: [],
    };

    for (let i = 0; i < config.size; i++) {
      newShip.position.push({
        x: selection.isVertical ? x : x + i,
        y: selection.isVertical ? y + i : y,
      });
    }

    setShips((prev) => [...prev, newShip]);
    setSelection({ type: null, isVertical: selection.isVertical }); // Reset selection but keep orientation
  };

  const handleCellHover = (x: number, y: number) => {
    setHoverCell({ x, y });
  };

  const handleCellLeave = () => {
    setHoverCell(null);
  };

  return {
    ships,
    placedMines,
    selection,
    hoverCell,
    selectShipType,
    toggleOrientation,
    placeShip,
    handleCellHover,
    handleCellLeave,
    isValidPlacement,
  };
};
