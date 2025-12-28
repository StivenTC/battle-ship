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
    type: ShipType | "MINE" | null;
    isVertical: boolean;
  };
  hoverCell: Coordinates | null;
}

export const useBoard = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [placedMines, setPlacedMines] = useState<Coordinates[]>([]);
  const [selection, setSelection] = useState<{
    type: ShipType | "MINE" | null;
    isVertical: boolean;
  }>({ type: null, isVertical: false });
  const [hoverCell, setHoverCell] = useState<Coordinates | null>(null);

  const selectShipType = (type: ShipType | "MINE") => {
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
            return false;
          }
        }
      }
    }

    // Check overlap with mines
    for (const mine of placedMines) {
      for (const newPos of positions) {
        if (mine.x === newPos.x && mine.y === newPos.y) {
          return false;
        }
      }
    }

    return true;
  };

  const MAX_SHIPS = 3;
  const MAX_MINES = 2;

  const placeShip = (x: number, y: number) => {
    if (!selection.type) return;

    if (selection.type === "MINE") {
      if (isValidPlacement({ x, y }, 1, false)) {
        setPlacedMines((prev) => {
          if (prev.length >= MAX_MINES) return prev; // Max reached
          return [...prev, { x, y }];
        });
        setSelection((prev) => ({ ...prev, type: null }));
      }
      return;
    }

    const config = SHIP_CONFIG[selection.type];
    if (!isValidPlacement({ x, y }, config.size, selection.isVertical)) {
      return;
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

    setShips((prev) => {
      // Check if we are moving an existing ship
      const isMoving = prev.some((s) => s.type === selection.type);

      // If NOT moving (adding new) and max reached, block
      if (!isMoving && prev.length >= MAX_SHIPS) {
        return prev;
      }

      // Remove existing ship of same type to enforce 1 per type
      const filtered = prev.filter((s) => s.type !== selection.type);
      return [...filtered, newShip];
    });

    // Auto-deselect after placement for better UX
    setSelection({ type: null, isVertical: selection.isVertical });
  };

  const removeShip = (shipId: string) => {
    setShips((prev) => prev.filter((s) => s.id !== shipId));
  };

  const removeMine = (x: number, y: number) => {
    setPlacedMines((prev) => prev.filter((m) => m.x !== x || m.y !== y));
  };

  const handleCellHover = (x: number, y: number) => {
    setHoverCell({ x, y });
  };

  const handleCellLeave = () => {
    setHoverCell(null);
  };

  const resetSelection = () => {
    setSelection((prev) => ({ ...prev, type: null }));
  };

  return {
    ships,
    placedMines,
    selection,
    hoverCell,
    selectShipType,
    resetSelection,
    toggleOrientation,
    placeShip,
    removeShip,
    removeMine,
    handleCellHover,
    handleCellLeave,
    isValidPlacement,
  };
};
