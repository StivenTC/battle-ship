import type { FC, SVGProps } from "react";

export const SubmarineShape: FC<SVGProps<SVGRectElement>> = ({ ...props }) => {
  const width = 32 * 3; // 96
  const height = 32;
  return (
    <rect x="2" y="6" width={width - 4} height={height - 12} rx="10" strokeWidth="2" {...props} />
  );
};
