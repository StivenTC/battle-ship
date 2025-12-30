import { useState, useCallback } from "react";
import { type ShipType, SHIPS_PER_PLAYER, MINES_PER_PLAYER } from "@battle-ship/shared";
import { Grid } from "../../Grid/Grid";
import { ShipSelection } from "../../Shipyard/ShipSelection";
import { ShipControls } from "../ShipControls/ShipControls";
import { TEXTS } from "../../../../constants/texts";
import styles from "./PlacementBoard.module.scss";
import { useBoard } from "../../../../hooks/useBoard";
import { useGame } from "../../../../hooks/useGame";

export const PlacementBoard = () => {
  const [selectedShips, setSelectedShips] = useState<ShipType[] | null>(null);
  const { gameState, playerId, actions } = useGame();

  const {
    ships: localShips,
    placedMines: localMines,
    selection,
    hoverCell,
    handleCellHover,
    handleCellLeave,
    placeShip: placeLocalShip,
    selectShipType,
    toggleOrientation,
    isValidPlacement,
    removeShip,
    removeMine,
  } = useBoard();

  const handleFleetConfirm = useCallback((ships: ShipType[]) => {
    setSelectedShips(ships);
  }, []);

  // DERIVE STATE
  const myPlayer = gameState && playerId ? gameState.players[playerId] : null;
  const serverShips = myPlayer?.ships || [];
  const displayShips = serverShips.length > 0 ? serverShips : localShips;

  const serverMines = myPlayer?.placedMines || [];
  const displayMines = serverMines.length > 0 ? serverMines : localMines;
  const currentMinesCount = displayMines.length;

  // HANDLERS
  const handleCellClick = (x: number, y: number) => {
    if (!selection.type) {
      if (!myPlayer) {
        const localShip = localShips.find((s) => s.position.some((p) => p.x === x && p.y === y));
        if (localShip) {
          removeShip(localShip.id);
          return;
        }
        const localMine = localMines.find((m) => m.x === x && m.y === y);
        if (localMine) {
          removeMine(x, y);
          return;
        }
      }
      return;
    }

    if (selection.type === "MINE") {
      if (myPlayer) actions.placeMine(x, y);
      else {
        placeLocalShip(x, y);
        // Sync if needed
        if (gameState && !myPlayer) actions.placeMine(x, y);
      }
    } else {
      if (myPlayer) actions.placeShip(selection.type, { x, y }, !selection.isVertical);
      else {
        placeLocalShip(x, y);
        if (gameState && !myPlayer)
          actions.placeShip(selection.type, { x, y }, !selection.isVertical);
      }
    }
  };

  const onDeploy = () => {
    actions.playerReady();
  };

  if (!selectedShips) {
    return <ShipSelection onConfirm={handleFleetConfirm} />;
  }

  const allShipsPlaced = displayShips.length >= SHIPS_PER_PLAYER;
  const allMinesPlaced = currentMinesCount >= MINES_PER_PLAYER;
  const readyToDeploy = allShipsPlaced && allMinesPlaced;

  return (
    <section className={styles.container}>
      <h2 className={styles.header}>{TEXTS.PLACEMENT.TITLE}</h2>
      <p className={styles.instruction}>
        {TEXTS.PLACEMENT.INSTRUCTION_MAIN} <br />
        <span className={styles.subtext}>{TEXTS.PLACEMENT.INSTRUCTION_SUB}</span>
      </p>

      <ShipControls
        selection={selection}
        minesPlacedCount={currentMinesCount}
        onSelectShip={selectShipType}
        onSelectMine={() => selectShipType("MINE")}
        onRotate={toggleOrientation}
        allowedShips={selectedShips}
      />

      <Grid
        ships={displayShips}
        mines={displayMines}
        // Interaction Props
        selection={selection}
        hoverCell={hoverCell}
        isValidPlacement={isValidPlacement}
        onCellClick={handleCellClick}
        onCellMouseEnter={handleCellHover}
        onCellMouseLeave={handleCellLeave}
        variant="default"
      />

      {myPlayer?.isReady ? (
        <div className={styles.stateMessage}>Esperando al oponente... 📡</div>
      ) : (
        <div className={styles.readyContainer}>
          <button
            type="button"
            className={styles.deployButton}
            disabled={!readyToDeploy}
            onClick={onDeploy}>
            {readyToDeploy ? "DESPLEGAR FLOTA 🚀" : "COMPLETA EL DESPLIEGUE"}
          </button>
        </div>
      )}
    </section>
  );
};
