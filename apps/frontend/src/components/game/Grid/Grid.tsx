import { type Coordinates, SHIP_CONFIG, SHIP_NAMES_ES, ShipType } from "@battle-ship/shared";
import clsx from "clsx";
import type { FC } from "react";
import { useBoard } from "../../../hooks/useBoard";
import { Cell } from "../Cell/Cell";
import { ShipAsset } from "../Ships/ShipAssets";
import styles from "./Grid.module.scss";

// Placeholder type until we connect it to a parent context
type GridProps = Record<string, never>;

const GRID_SIZE = 8;
const CELL_SIZE = 32;
const GAP_SIZE = 1;

export const Grid: FC<GridProps> = () => {
  const {
    ships,
    selection,
    hoverCell,
    handleCellHover,
    handleCellLeave,
    placeShip,
    selectShipType,
    toggleOrientation,
    isValidPlacement,
  } = useBoard();

  // Helper to calculate pixel position based on grid index
  const getPosition = (index: number) => index * (CELL_SIZE + GAP_SIZE);

  const handleShipSelect = (type: ShipType) => {
    selectShipType(type);
  };

  const renderControls = () => (
    <div className={styles.controls}>
      {Object.values(ShipType).map((type) => (
        <button
          type="button"
          key={type}
          onClick={() => handleShipSelect(type)}
          className={clsx(styles.button, {
            [styles["button--active"]]: selection.type === type,
          })}>
          {SHIP_NAMES_ES[type]}
        </button>
      ))}
      <button
        type="button"
        onClick={toggleOrientation}
        className={clsx(styles.button, styles["button--rotate"])}>
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
    <div className={styles.container}>
      {renderControls()}
      <div className={styles.gridWrapper}>
        <div className={styles.grid} onMouseLeave={handleCellLeave}>
          {renderCells()}
          <div className={styles.shipLayer}>{renderShips()}</div>
          <div className={styles.ghostLayer}>
            <GhostShipOverlay
              selection={selection}
              hoverCell={hoverCell}
              isValidPlacement={isValidPlacement}
              getPosition={getPosition}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Helper Component for Ghost Ship
const GhostShipOverlay: FC<{
  selection: { type: ShipType | null; isVertical: boolean };
  hoverCell: Coordinates | null;
  isValidPlacement: (start: Coordinates, size: number, vertical: boolean) => boolean;
  getPosition: (index: number) => number;
}> = ({ selection, hoverCell, isValidPlacement, getPosition }) => {
  if (!selection.type || !hoverCell) return null;

  const size = SHIP_CONFIG[selection.type].size;
  const valid = isValidPlacement(hoverCell, size, selection.isVertical);

  return (
    <div
      className={clsx(styles.ghostParams, {
        [styles["ghostParams--valid"]]: valid,
        [styles["ghostParams--invalid"]]: !valid,
      })}
      style={{
        left: `${getPosition(hoverCell.x)}px`,
        top: `${getPosition(hoverCell.y)}px`,
      }}>
      <ShipAsset type={selection.type} isVertical={selection.isVertical} />
    </div>
  );
};
