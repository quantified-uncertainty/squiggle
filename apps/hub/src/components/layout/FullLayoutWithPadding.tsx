import { FC, PropsWithChildren } from "react";

export const FullLayoutWithPadding: FC<PropsWithChildren> = ({ children }) => {
  return <div className="p-4">{children}</div>;
};
