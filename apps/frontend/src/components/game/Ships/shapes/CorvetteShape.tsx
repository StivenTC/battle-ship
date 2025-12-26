import type { FC, SVGProps } from "react";

export const CorvetteShape: FC<SVGProps<SVGGElement>> = ({ ...props }) => {
  const width = 32 * 2; // 64
  const height = 32;
  return (
    <g {...props}>
      <rect x="2" y="6" width={width - 4} height={height - 12} strokeWidth="2" />
      <line x1={width / 2} y1="6" x2={width / 2} y2={height - 6} strokeWidth="2" />
    </g>
  );
};
