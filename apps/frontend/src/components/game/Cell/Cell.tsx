import type { CellState } from "@battle-ship/shared";
import clsx from "clsx";
import type { FC, KeyboardEvent } from "react";
import styles from "./Cell.module.scss";

interface CellProps {
  x: number;
  y: number;
  state: CellState;
  isGhost?: boolean;
  onClick: (x: number, y: number) => void;
  onMouseEnter?: () => void;
}

export const Cell: FC<CellProps> = ({ x, y, state, isGhost, onClick, onMouseEnter }) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      onClick(x, y);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx(styles.cell, {
        [styles["cell--empty"]]: state === "EMPTY",
        [styles["cell--ship"]]: state === "SHIP",
        [styles["cell--hit"]]: state === "HIT",
        [styles["cell--miss"]]: state === "MISS",
        [styles["cell--revealed"]]: state === "REVEALED",
        [styles["cell--revealed-ship"]]: state === "REVEALED_SHIP",
        [styles["cell--revealed-empty"]]: state === "REVEALED_EMPTY",
        [styles["cell--ghost"]]: isGhost, // Visual preview
      })}
      onClick={() => onClick(x, y)}
      onMouseEnter={onMouseEnter}
      onKeyDown={handleKeyDown}
      data-testid={`cell-${x}-${y}`}
    />
  );
};
