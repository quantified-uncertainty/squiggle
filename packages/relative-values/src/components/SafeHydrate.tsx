import { FC, useEffect, useState } from "react";

export const SafeHydrate: FC<{ children: () => React.ReactNode }> = ({
  children,
}) => {
  const [render, setRender] = useState(false);

  useEffect(() => setRender(true), []);
  return <div suppressHydrationWarning>{render ? children() : null}</div>;
};
