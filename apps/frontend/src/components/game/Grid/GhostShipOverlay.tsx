import { type Coordinates, SHIP_CONFIG, type ShipType } from "@battle-ship/shared";
import clsx from "clsx";
import type { FC } from "react";
import { ShipAsset } from "../Ships/ShipAssets";
import styles from "./Grid.module.scss";

interface GhostShipOverlayProps {
  selection: { type: ShipType | "MINE" | null; isVertical: boolean };
  hoverCell: Coordinates | null;
  isValidPlacement: (start: Coordinates, size: number, vertical: boolean) => boolean;
  getPosition: (index: number) => number;
}

export const GhostShipOverlay: FC<GhostShipOverlayProps> = ({
  selection,
  hoverCell,
  isValidPlacement,
  getPosition,
}) => {
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
            fontSize: "20px",
          }}>
          💣
        </div>
      ) : (
        <ShipAsset type={selection.type} isVertical={selection.isVertical} />
      )}
    </div>
  );
};
