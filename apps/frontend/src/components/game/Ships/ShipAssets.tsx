import { ShipType } from "@battle-ship/shared";
import type { FC, SVGProps } from "react";
import { BattleshipShape } from "./shapes/BattleshipShape";
import { CarrierShape } from "./shapes/CarrierShape";
import { CorvetteShape } from "./shapes/CorvetteShape";
import { DestroyerShape } from "./shapes/DestroyerShape";
import { SubmarineShape } from "./shapes/SubmarineShape";

interface ShipAssetProps extends SVGProps<SVGSVGElement> {
  type: ShipType;
  isVertical?: boolean;
}

const CELL_SIZE = 32;

export const ShipAsset: FC<ShipAssetProps> = ({ type, isVertical = false, style, ...props }) => {
  let width = 0;
  const height = CELL_SIZE;

  // Define width based on type
  switch (type) {
    case ShipType.Carrier:
      width = CELL_SIZE * 5;
      break;
    case ShipType.Battleship:
      width = CELL_SIZE * 4;
      break;
    case ShipType.Destroyer:
    case ShipType.Submarine:
      width = CELL_SIZE * 3;
      break;
    case ShipType.Corvette:
      width = CELL_SIZE * 2;
      break;
  }

  // Swap dimensions if vertical
  const viewBoxWidth = isVertical ? height : width;
  const viewBoxHeight = isVertical ? width : height;

  const finalWidth = isVertical ? height : width;
  const finalHeight = isVertical ? width : height;

  const commonStyle = {
    ...style,
    width: finalWidth,
    height: finalHeight,
    display: "block",
    overflow: "visible", // Allow stroke to not be clipped
  };

  const transform = isVertical ? `rotate(90, ${height / 2}, ${height / 2})` : undefined;

  // Colors from CSS variables
  const strokeColor = "var(--color-radar-primary)";
  const fillColor = "var(--color-radar-dim)";

  const shapeProps = {
    stroke: strokeColor,
    fill: fillColor,
    transform: transform,
  };

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} style={commonStyle} {...props}>
      <title>{type}</title>
      <g>
        {type === ShipType.Carrier && <CarrierShape {...shapeProps} />}
        {type === ShipType.Battleship && <BattleshipShape {...shapeProps} />}
        {type === ShipType.Destroyer && <DestroyerShape {...shapeProps} />}
        {type === ShipType.Submarine && <SubmarineShape {...shapeProps} />}
        {type === ShipType.Corvette && <CorvetteShape {...shapeProps} />}
      </g>
    </svg>
  );
};
