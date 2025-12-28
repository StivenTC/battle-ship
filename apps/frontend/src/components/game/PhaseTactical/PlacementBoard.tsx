import { useState, useCallback } from "react";
import type { ShipType } from "@battle-ship/shared";
import { Grid } from "../Grid/Grid";
import { ShipSelection } from "../Shipyard/ShipSelection";
import styles from "./PlacementBoard.module.scss";

interface PlacementBoardProps {
  onReady: () => void;
}

export const PlacementBoard = ({ onReady }: PlacementBoardProps) => {
  const [selectedShips, setSelectedShips] = useState<ShipType[] | null>(null);

  const handleFleetConfirm = useCallback((ships: ShipType[]) => {
    setSelectedShips(ships);
  }, []);

  if (!selectedShips) {
    return <ShipSelection onConfirm={handleFleetConfirm} />;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>FASE TÁCTICA</h2>
      <p className={styles.instruction}>
        Posiciona tus 3 barcos y 2 minas. <br />
        <span className={styles.subtext}>
          Arrastra o pulsa para colocar. Rotar con click derecho o botón.
        </span>
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
    </div>
  );
};
