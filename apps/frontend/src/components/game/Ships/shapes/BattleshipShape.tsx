import type { FC, SVGProps } from "react";

export const BattleshipShape: FC<SVGProps<SVGGElement>> = ({ ...props }) => {
  const width = 32 * 4; // 128
  const height = 32;
  return (
    <g {...props}>
      <rect x="2" y="4" width={width - 4} height={height - 8} strokeWidth="2" />
      {/* Turrets */}
      <circle cx={40} cy={height / 2} r="6" />
      <circle cx={70} cy={height / 2} r="6" />
      <circle cx={100} cy={height / 2} r="6" />
    </g>
  );
};
