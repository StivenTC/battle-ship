import type { FC, SVGProps } from "react";

export const CarrierShape: FC<SVGProps<SVGPathElement>> = ({ ...props }) => {
  const width = 32 * 5; // 160
  const height = 32;
  return (
    <path
      d={`M2,4 L${width - 2},4 L${width - 10},${height - 4} L10,${
        height - 4
      } Z M20,${height / 2} L${width - 20},${height / 2}`}
      strokeWidth="2"
      {...props}
    />
  );
};
