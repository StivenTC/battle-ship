import { type Coordinates, SHIP_NAMES_ES, ShipType } from "@battle-ship/shared";
import type { FC } from "react";
import { type BoardState, useBoard } from "../../../hooks/useBoard";
import { Cell } from "../Cell/Cell";
import { ShipAsset } from "../Ships/ShipAssets";
import styles from "./Grid.module.scss";

// Placeholder type until we connect it to a parent context
type GridProps = Record<string, never>;

const GRID_SIZE = 8;

export const Grid: FC<GridProps> = () => {
  const {
    ships,
    selection,
    hoverCell,
    handleCellHover,
    handleCellLeave,
    placeShip,
    selectShipType, // Exposed for testing/buttons
    toggleOrientation, // Exposed for testing/buttons
  } = useBoard();

  // Temporary UI for selecting ships and rotating
  const renderControls = () => (
    <div className="flex flex-wrap gap-2 mb-4 justify-center">
      {Object.values(ShipType).map((type) => (
        <button
          type="button"
          key={type}
          onClick={() => selectShipType(type)}
          className={`px-3 py-1 rounded text-sm ${
            selection.type === type
              ? "bg-[var(--color-accent-blue)] text-white"
              : "bg-[var(--color-bg-surface)] text-[var(--color-text-main)] border border-[var(--color-radar-primary)]"
          }`}
          style={{
            borderColor: selection.type === type ? "var(--color-accent-blue)" : "",
          }}>
          {SHIP_NAMES_ES[type]}
        </button>
      ))}
      <button
        type="button"
        onClick={toggleOrientation}
        className="px-3 py-1 rounded text-sm bg-[var(--color-bg-surface)] border border-[var(--color-accent-orange)] text-[var(--color-accent-orange)]">
        Rotar {selection.isVertical ? "↕" : "↔"}
      </button>
    </div>
  );

  const renderShips = () => {
    return ships.map((ship) => {
      const { x, y } = ship.position[0];
      const isVertical = ship.position.length > 1 && ship.position[0].x === ship.position[1].x;
      return (
        <div
          key={ship.id}
          style={{
            position: "absolute",
            left: `${x * 12.5}%`,
            top: `${y * 12.5}%`,
            pointerEvents: "none",
            zIndex: 10,
          }}>
          {/* ShipAsset renders assuming 32px base, but we might need scaling if Grid is flexible. 
              However, design system says fixed unit grid. If we use % for position, 
              assets should ideally likely match % or be fixed. 
              For now keeping fixed 32px base but position is fluid. */}
          <ShipAsset type={ship.type} isVertical={isVertical} />
        </div>
      );
    });
  };

  // Note: Ghost ship logic requires calculating validity again in render or hook
  // For simplicity, we just render it at hoverCell if selection.type is set
  const renderGhostShip = () => {
    if (!selection.type || !hoverCell) return null;

    // TODO: We technically need to know validity to color it red/green
    // passed from hook or recalculated here.
    // Assuming valid green for now, relying on click to block invalid.

    return (
      <div
        style={{
          position: "absolute",
          left: `${hoverCell.x * 12.5}%`,
          top: `${hoverCell.y * 12.5}%`,
          pointerEvents: "none",
          zIndex: 20,
          opacity: 0.5,
        }}>
        <ShipAsset type={selection.type} isVertical={selection.isVertical} />
      </div>
    );
  };

  const renderCells = () => {
    const cells: JSX.Element[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push(
          <Cell
            key={`${x}-${y}`}
            x={x}
            y={y}
            state={"EMPTY"}
            onClick={(gx, gy) => placeShip(gx, gy)} // gx, gy are just args passed back
            onMouseEnter={() => handleCellHover(x, y)}
          />
        );
      }
    }
    return cells;
  };

  return (
    <>
      {renderControls()}
      <div className={styles.grid} onMouseLeave={handleCellLeave} style={{ position: "relative" }}>
        {renderCells()}
        {renderShips()}
        {renderGhostShip()}
      </div>
    </>
  );
};
