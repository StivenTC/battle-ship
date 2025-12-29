import { useState, useCallback } from "react";
import type { ShipType } from "@battle-ship/shared";
import { Grid } from "../Grid/Grid";
import { ShipSelection } from "../Shipyard/ShipSelection";
import { TEXTS } from "../../../constants/texts";
import styles from "./PlacementBoard.module.scss";

interface PlacementBoardProps {
  onReady: () => void;
}

export const PlacementBoard = ({ onReady: _onReady }: PlacementBoardProps) => {
  const [selectedShips, setSelectedShips] = useState<ShipType[] | null>(null);

  const handleFleetConfirm = useCallback((ships: ShipType[]) => {
    setSelectedShips(ships);
  }, []);

  if (!selectedShips) {
    return <ShipSelection onConfirm={handleFleetConfirm} />;
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.header}>{TEXTS.PLACEMENT.TITLE}</h2>
      <p className={styles.instruction}>
        {TEXTS.PLACEMENT.INSTRUCTION_MAIN} <br />
        <span className={styles.subtext}>{TEXTS.PLACEMENT.INSTRUCTION_SUB}</span>
      </p>

      {/* 
        We pass the selected ships to Grid. 
        Grid will handle the specific placement logic using useBoard hook internally for now.
        Eventually we might lift that state up, but for this refactor we keep it simple.
        However, Grid needs to know WHICH ships are allowed to be placed.
      */}
      <Grid allowedShips={selectedShips} />

      {/* 
         Note: The "Ready" button logic is currently INSIDE Grid.tsx 
         We will move the container logic here in the next step, 
         but for step 1 let's just render Grid which has the controls.
      */}
    </section>
  );
};
