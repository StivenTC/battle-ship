import type { CellState, GameState } from "@battle-ship/shared";
import type { Ship } from "@battle-ship/shared";
import type { FC } from "react";
import { Cell } from "./Cell";
import styles from "./Grid.module.scss";

// Placeholder type
interface GridProps {
  cells?: unknown[][]; // Should use Board state
}

const GRID_SIZE = 8;

export const Grid: FC<GridProps> = () => {
  // Temporary mock data generator
  const renderCells = () => {
    const cells: JSX.Element[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push(
          <Cell
            key={`${x}-${y}`}
            x={x}
            y={y}
            state={Math.random() > 0.9 ? "SHIP" : "EMPTY"} // Random for preview
            onClick={(gx, gy) => console.log("Clicked", gx, gy)}
          />
        );
      }
    }
    return cells;
  };

  return <div className={styles.grid}>{renderCells()}</div>;
};
