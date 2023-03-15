import { useRouter } from "next/router";
import { FC } from "react";

export const SafeHydrate: FC<{ children: () => React.ReactNode }> = ({
  children,
}) => {
  const { isReady } = useRouter();

  return (
    <div suppressHydrationWarning>
      {typeof window === "undefined" || !isReady ? null : children()}
    </div>
  );
};
