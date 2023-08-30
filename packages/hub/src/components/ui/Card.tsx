import { FC, PropsWithChildren } from "react";

export const Card: FC<PropsWithChildren> = ({ children }) => {
  return <div className="shadow p-3 rounded bg-white">{children}</div>;
};
