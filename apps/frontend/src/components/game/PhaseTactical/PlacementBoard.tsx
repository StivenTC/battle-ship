import { useState, useCallback } from "react";
import type { ShipType } from "@battle-ship/shared";
import { Grid } from "../Grid/Grid";
import { ShipSelection } from "../Shipyard/ShipSelection";
import { ShipControls } from "./ShipControls";
import { TEXTS } from "../../../constants/texts";
import styles from "./PlacementBoard.module.scss";
import { useBoard } from "../../../hooks/useBoard";
import { useGame } from "../../../hooks/useGame";

interface PlacementBoardProps {
  onReady: () => void;
}

export const PlacementBoard = ({ onReady: _onReady }: PlacementBoardProps) => {
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

  // Mines logic (Local vs Server)
  // Server mines might be just a number or array depending on implementation.
  // Assuming array for visualization similarity.
  const serverMines = myPlayer?.placedMines || [];
  const displayMines = serverMines.length > 0 ? serverMines : localMines;
  const currentMinesCount = displayMines.length;

  // HANDLERS
  const handleCellClick = (x: number, y: number) => {
    // If no type selected, handle removal (Local only for now or Server remove?)
    // Currently backend doesn't support 'removeShip' directly via socket during placement easily without resetting.
    // So usually placement is additive until 'Reset' or individualized if supported.
    // For now, let's keep the existing logic: Only place if selection active.

    if (!selection.type) {
      // Local removal fallback
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
        placeLocalShip(x, y); // placeLocalShip handles mines internally in useBoard if type is MINE? Yes.
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

  // Ready State Check
  const allShipsPlaced = displayShips.length >= 3;
  const allMinesPlaced = currentMinesCount >= 2;
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
