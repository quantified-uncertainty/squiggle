import { FC, PropsWithChildren } from "react";

export const SafeHydrate: FC<{ children: () => React.ReactNode }> = ({
  children,
}) => {
  return (
    <div suppressHydrationWarning>
      {typeof window === "undefined" ? null : children()}
    </div>
  );
};
