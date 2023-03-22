import { FC, PropsWithChildren } from "react";

export type IconProps = PropsWithChildren<{
  size?: number;
  className?: string;
  onClick?: () => void;
}>;

export const Icon: FC<IconProps> = ({
  size = 20,
  className = "fill-black stroke-black",
  onClick,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    onClick={onClick}
    className={className}
  >
    {children}
  </svg>
);
