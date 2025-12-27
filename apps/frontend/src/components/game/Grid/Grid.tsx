import {
  type Coordinates,
  GRID_SIZE,
  SHIP_CONFIG,
  SHIP_NAMES_ES,
  ShipType,
} from "@battle-ship/shared";
import clsx from "clsx";
import type { FC } from "react";
import { useBoard } from "../../../hooks/useBoard";
import { useGame } from "../../../hooks/useGame";
import { Cell } from "../Cell/Cell";
import { ShipAsset } from "../Ships/ShipAssets";
import styles from "./Grid.module.scss";

// Placeholder type until we connect it to a parent context
type GridProps = {
  allowedShips?: ShipType[];
};

const CELL_SIZE = 32;
const GAP_SIZE = 1;

export const Grid: FC<GridProps> = ({ allowedShips }) => {
  const { gameState, playerId, actions } = useGame();

  const {
    ships: localShips,
    placedMines: localMines,
    selection,
    hoverCell,
    handleCellHover,
    handleCellLeave,
    placeShip: placeLocalShip, // Renamed to avoid config
    selectShipType,
    toggleOrientation,
    isValidPlacement,
  } = useBoard();

  // DERIVE SHIPS: Use Server state if available, otherwise local (for now/fallback)
  // In a real game, we rely on gameState.players[playerId].ships
  const myPlayer = gameState && playerId ? gameState.players[playerId] : null;
  const displayShips = myPlayer ? myPlayer.ships : localShips;

  // Helper to calculate pixel position based on grid index
  const getPosition = (index: number) => index * (CELL_SIZE + GAP_SIZE);

  const handleShipSelect = (type: ShipType) => {
    selectShipType(type);
  };

  const onCellClick = (x: number, y: number) => {
    if (!selection.type) return;

    // Server Action
    if (gameState && myPlayer) {
      if (selection.type === "MINE") {
        actions.placeMine(x, y);
      } else {
        actions.placeShip(selection.type, { x, y }, selection.isVertical);
      }
    } else {
      // Local fallback
      placeLocalShip(x, y);
    }
  };

  const renderControls = () => {
    const shipsToShow = allowedShips || (Object.values(ShipType) as ShipType[]);

    // Server: mines is a number (remaining). Local: placedMines is array (placed).
    // We want to show "Mines (Placed/Max)" or "Mines (Remaining)".
    // Button label says: "Minas ({minesCount}/2)".
    // Let's assume minesCount means "Placed Count".

    let placedCount = 0;
    if (myPlayer) {
      // Backend: mines = remaining. placedMines = array of placed.
      placedCount = myPlayer.placedMines.length;
    } else {
      placedCount = localMines.length;
    }

    const minesLeft = 2 - placedCount;

    return (
      <div className={styles.controls}>
        {shipsToShow.map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => handleShipSelect(type)}
            className={clsx(styles.button, {
              [styles["button--active"]]: selection.type === type,
            })}>
            {SHIP_NAMES_ES[type]} ({SHIP_CONFIG[type].size})
          </button>
        ))}

        {/* Mine Button */}
        <button
          type="button"
          onClick={() => selectShipType("MINE")}
          disabled={minesLeft <= 0}
          className={clsx(styles.button, styles["button--mine"], {
            [styles["button--active"]]: selection.type === "MINE",
          })}>
          Minas ({placedCount}/2)
        </button>

        <button
          type="button"
          onClick={toggleOrientation}
          className={clsx(styles.button, styles["button--rotate"])}>
          Rotar {selection.isVertical ? "↕" : "↔"}
        </button>
      </div>
    );
  };

  const renderReadyButton = () => {
    // If in combat, we don't show the ready button or waiting message here.
    // The parent Grid might need to handle combat UI differently, but for now let's just hide this blocking overlay.
    if (gameState?.status === "Combat") return null;

    if (!myPlayer) return null;

    // Check if we have placed 3 ships (Carrier size check is a hack from previous code, relying on count is safer)
    const allShipsPlaced = displayShips.length >= 3;

    // Check mines
    const placedMinesCount = myPlayer.placedMines.length;

    // We need 3 ships and 2 mines
    const readyToDeploy = allShipsPlaced && placedMinesCount === 2;

    if (myPlayer.isReady) {
      return <div className={clsx(styles.stateMessage)}>Esperando al oponente... 📡</div>;
    }

    return (
      <div className={styles.readyContainer}>
        <button
          type="button"
          className={clsx(styles.button, styles.deployButton)}
          disabled={!readyToDeploy}
          onClick={() => actions.playerReady()}>
          {readyToDeploy ? "DESPLEGAR FLOTA 🚀" : "COMPLETA EL DESPLIEGUE"}
        </button>
      </div>
    );
  };

  const renderShips = () => {
    return displayShips.map((ship) => {
      if (!ship.position || ship.position.length === 0) {
        console.warn("Ship has no position:", ship);
        return null;
      }
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
    const mines = myPlayer ? myPlayer.placedMines : localMines;
    return mines.map((mine: Coordinates) => {
      if (!mine || typeof mine.x !== "number" || typeof mine.y !== "number") {
        console.warn("Invalid mine data:", mine);
        return null;
      }
      return (
        <div
          key={`mine-${mine.x}-${mine.y}`}
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
        cells.push(
          <Cell
            key={`${x}-${y}`}
            x={x}
            y={y}
            state={"EMPTY"}
            onClick={(gx, gy) => onCellClick(gx, gy)}
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
      {renderReadyButton()}
      <div className={styles.gridWrapper}>
        <div className={styles.grid} onMouseLeave={handleCellLeave}>
          {renderCells()}
          <div className={styles.shipLayer}>{renderShips()}</div>
          <div className={styles.shipLayer}>{renderMines()}</div>
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
  selection: { type: ShipType | "MINE" | null; isVertical: boolean };
  hoverCell: Coordinates | null;
  isValidPlacement: (start: Coordinates, size: number, vertical: boolean) => boolean;
  getPosition: (index: number) => number;
}> = ({ selection, hoverCell, isValidPlacement, getPosition }) => {
  if (!selection.type || !hoverCell) return null;

  const size = selection.type === "MINE" ? 1 : SHIP_CONFIG[selection.type].size;
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
      {selection.type === "MINE" ? (
        <div
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          💣
        </div>
      ) : (
        <ShipAsset type={selection.type} isVertical={selection.isVertical} />
      )}
    </div>
  );
};
