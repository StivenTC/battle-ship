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

  const commonStyle = {
    ...style,
    width: viewBoxWidth,
    height: viewBoxHeight,
    display: "block",
    overflow: "visible",
  };

  // If vertical, we need to rotate the internal group or the SVG itself.
  // The logic `rotate(90, height/2, height/2)` assumes square pivot, which might push long ships out of view.
  // Better approach: If vertical, just rotate the <g> around (0,0) and translate if needed?
  // Actually, standard SVG rotation: rotate(90) rotates around 0,0.
  // If we rotate 90, x becomes vertical -y.
  // Let's try simpler: Render horizontal, and rotate the DIV wrapper in Grid.tsx?
  // Previous code had rotation in `ShipAsset`. Let's stick to that but fix it.

  // Rotating around the top-left cell center (16,16) might be safer?
  // transform={`rotate(90, ${CELL_SIZE/2}, ${CELL_SIZE/2})`}
  const transform = isVertical ? `rotate(90, ${CELL_SIZE / 2}, ${CELL_SIZE / 2})` : undefined;

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
