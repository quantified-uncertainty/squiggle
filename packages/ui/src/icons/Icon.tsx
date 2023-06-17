import { FC, PropsWithChildren } from "react";

export type IconProps = PropsWithChildren<{
  size?: number;
  className?: string;
  onClick?: () => void;
}>;

export const Icon: FC<IconProps & { viewBox?: string }> = ({
  size = 20,
  className,
  onClick,
  viewBox = "0 0 20 20",
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill="currentColor"
    onClick={onClick}
    className={className}
  >
    {children}
  </svg>
);
