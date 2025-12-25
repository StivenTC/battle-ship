import { ShipType } from "@battle-ship/shared";
import type { FC, SVGProps } from "react";

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

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} style={commonStyle} {...props}>
      <title>{type}</title>
      <g transform={transform}>
        {/* Render Specific Ship Shapes */}
        {type === ShipType.Carrier && (
          <path
            d={`M2,4 L${width - 2},4 L${width - 10},${height - 4} L10,${
              height - 4
            } Z M20,${height / 2} L${width - 20},${height / 2}`}
            stroke={strokeColor}
            fill={fillColor}
            strokeWidth="2"
          />
        )}

        {type === ShipType.Battleship && (
          <>
            <rect
              x="2"
              y="4"
              width={width - 4}
              height={height - 8}
              stroke={strokeColor}
              fill={fillColor}
              strokeWidth="2"
            />
            {/* Turrets */}
            <circle cx={40} cy={height / 2} r="6" fill={strokeColor} />
            <circle cx={70} cy={height / 2} r="6" fill={strokeColor} />
            <circle cx={100} cy={height / 2} r="6" fill={strokeColor} />
          </>
        )}

        {type === ShipType.Destroyer && (
          <>
            <path
              d={`M2,4 L${width - 10},4 L${width - 2},${height / 2} L${
                width - 10
              },${height - 4} L2,${height - 4} Z`}
              stroke={strokeColor}
              fill={fillColor}
              strokeWidth="2"
            />
            <rect x="20" y="10" width="10" height="12" fill={strokeColor} />
            <rect x="50" y="10" width="10" height="12" fill={strokeColor} />
          </>
        )}

        {type === ShipType.Submarine && (
          <rect
            x="2"
            y="6"
            width={width - 4}
            height={height - 12}
            rx="10"
            stroke={strokeColor}
            fill={fillColor}
            strokeWidth="2"
          />
        )}

        {type === ShipType.Corvette && (
          <>
            <rect
              x="2"
              y="6"
              width={width - 4}
              height={height - 12}
              stroke={strokeColor}
              fill={fillColor}
              strokeWidth="2"
            />
            <line
              x1={width / 2}
              y1="6"
              x2={width / 2}
              y2={height - 6}
              stroke={strokeColor}
              strokeWidth="2"
            />
          </>
        )}
      </g>
    </svg>
  );
};
