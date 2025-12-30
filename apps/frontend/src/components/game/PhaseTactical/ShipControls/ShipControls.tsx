import { SHIP_CONFIG, SHIP_NAMES_ES, ShipType } from "@battle-ship/shared";
import clsx from "clsx";
import type { FC } from "react";
import styles from "./ShipControls.module.scss";

interface ShipControlsProps {
  selection: { type: ShipType | "MINE" | null; isVertical: boolean };
  minesPlacedCount: number;
  onSelectShip: (type: ShipType) => void;
  onSelectMine: () => void;
  onRotate: () => void;
  allowedShips?: ShipType[];
}

export const ShipControls: FC<ShipControlsProps> = ({
  selection,
  minesPlacedCount,
  onSelectShip,
  onSelectMine,
  onRotate,
  allowedShips,
}) => {
  const shipsToShow = allowedShips || (Object.values(ShipType) as ShipType[]);
  const minesLeft = 2 - minesPlacedCount;

  return (
    <div className={styles.controls}>
      {shipsToShow.map((type) => (
        <button
          type="button"
          key={type}
          onClick={() => onSelectShip(type)}
          className={clsx(styles.button, {
            [styles["button--active"]]: selection.type === type,
          })}>
          {SHIP_NAMES_ES[type]} ({SHIP_CONFIG[type].size})
        </button>
      ))}

      <button
        type="button"
        onClick={onSelectMine}
        disabled={minesLeft <= 0}
        className={clsx(styles.button, styles["button--mine"], {
          [styles["button--active"]]: selection.type === "MINE",
        })}>
        Minas ({minesPlacedCount}/2)
      </button>

      <button
        type="button"
        onClick={onRotate}
        className={clsx(styles.button, styles["button--rotate"])}>
        Rotar {selection.isVertical ? "↕" : "↔"}
      </button>
    </div>
  );
};
