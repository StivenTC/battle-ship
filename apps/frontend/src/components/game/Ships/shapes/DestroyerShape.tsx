import type { FC, SVGProps } from "react";

export const DestroyerShape: FC<SVGProps<SVGGElement>> = ({ ...props }) => {
  const width = 32 * 3; // 96
  const height = 32;
  return (
    <g {...props}>
      <path
        d={`M2,4 L${width - 10},4 L${width - 2},${height / 2} L${
          width - 10
        },${height - 4} L2,${height - 4} Z`}
        strokeWidth="2"
      />
      <rect x="20" y="10" width="10" height="12" />
      <rect x="50" y="10" width="10" height="12" />
    </g>
  );
};
