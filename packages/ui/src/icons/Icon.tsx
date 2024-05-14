import { FC, PropsWithChildren } from "react";

export type IconProps = PropsWithChildren<{
  size?: number;
  className?: string;
  onClick?: () => void;
  strokeWidth?: number;
  stroke?: string;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  fill?: string;
}>;

export const Icon: FC<IconProps & { viewBox?: string }> = ({
  size = 20,
  className,
  onClick,
  viewBox = "0 0 20 20",
  strokeWidth,
  stroke,
  strokeLinecap,
  strokeLinejoin,
  fill = "currentColor",
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill={fill}
    onClick={onClick}
    className={className}
    strokeWidth={strokeWidth}
    stroke={stroke}
    strokeLinecap={strokeLinecap}
    strokeLinejoin={strokeLinejoin}
  >
    {children}
  </svg>
);
