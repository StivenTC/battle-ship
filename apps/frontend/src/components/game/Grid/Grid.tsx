import {
  type Coordinates,
  GRID_SIZE,
  type Ship,
  type ShipType,
  type CellState,
} from "@battle-ship/shared";
import clsx from "clsx";
import type { FC } from "react";
import { Cell } from "../Cell/Cell";
import { ShipAsset } from "../Ships/ShipAssets";
import { GhostShipOverlay } from "./GhostShipOverlay";
import styles from "./Grid.module.scss";

// Pure Presentation Component
interface GridProps {
  ships: Ship[];
  mines?: Coordinates[];
  hits?: Set<string>;
  misses?: Set<string>;
  customStates?: Map<string, CellState>;
  variant?: "default" | "friendly" | "enemy";

  // Interactive Props (Optional)
  selection?: { type: ShipType | "MINE" | null; isVertical: boolean };
  hoverCell?: Coordinates | null;
  allowedShips?: ShipType[];

  onCellClick?: (x: number, y: number) => void;
  onCellMouseEnter?: (x: number, y: number) => void;
  onCellMouseLeave?: () => void;

  isValidPlacement?: (start: Coordinates, size: number, vertical: boolean) => boolean;
}

const CELL_SIZE = 32;
const GAP_SIZE = 1;

export const Grid: FC<GridProps> = ({
  ships,
  mines = [],
  hits = new Set(),
  misses = new Set(),
  customStates,
  variant = "default",
  selection,
  hoverCell,
  onCellClick,
  onCellMouseEnter,
  onCellMouseLeave,
  isValidPlacement,
}) => {
  // Helper to calculate pixel position based on grid index
  const getPosition = (index: number) => index * (CELL_SIZE + GAP_SIZE);

  const renderShips = () => {
    return ships.map((ship) => {
      // Safety check for unsynced ships
      if (!ship.position || ship.position.length === 0) return null;

      const { x, y } = ship.position[0];
      const isVertical = ship.position.length > 1 && ship.position[0].x === ship.position[1].x;

      return (
        <div
          key={ship.id}
          className={styles.ship}
          style={{
            left: `${getPosition(x)}px`,
            top: `${getPosition(y)}px`,
            zIndex: 10,
          }}>
          <ShipAsset type={ship.type} isVertical={isVertical} />
        </div>
      );
    });
  };

  const renderMines = () => {
    return mines.map((mine: Coordinates, idx) => {
      if (!mine || typeof mine.x !== "number" || typeof mine.y !== "number") return null;
      return (
        <div
          key={`mine-${idx}`} // Use idx if no ID, mines are simple coords
          className={styles.mine}
          style={{
            left: `${getPosition(mine.x)}px`,
            top: `${getPosition(mine.y)}px`,
          }}>
          💣
        </div>
      );
    });
  };

  const renderCells = () => {
    const cells: JSX.Element[] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const key = `${x},${y}`;
        let cellState: CellState = "EMPTY";

        if (customStates && customStates.has(key)) {
          // biome-ignore lint/style/noNonNullAssertion: Checked with has()
          cellState = customStates.get(key)!;
        } else {
          if (hits.has(key)) cellState = "HIT";
          else if (misses.has(key)) cellState = "MISS";
        }

        cells.push(
          <Cell
            key={key}
            x={x}
            y={y}
            state={cellState}
            onClick={(gx, gy) => onCellClick?.(gx, gy)}
            onMouseEnter={() => onCellMouseEnter?.(x, y)}
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className={styles.container}>
      <div className={styles.gridWrapper}>
        <div
          className={clsx(styles.grid, {
            [styles.friendly]: variant === "friendly",
            [styles.enemy]: variant === "enemy",
          })}
          onMouseLeave={onCellMouseLeave}>
          {renderCells()}

          <div className={styles.shipLayer}>{renderShips()}</div>
          <div className={styles.shipLayer}>{renderMines()}</div>

          {selection && hoverCell && isValidPlacement && (
            <div className={styles.ghostLayer}>
              <GhostShipOverlay
                selection={selection}
                hoverCell={hoverCell}
                isValidPlacement={isValidPlacement}
                getPosition={getPosition}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
