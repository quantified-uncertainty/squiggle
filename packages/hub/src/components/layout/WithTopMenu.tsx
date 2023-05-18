import { FC, ReactNode } from "react";

type Props = {
  children: [ReactNode, ReactNode];
};

export const WithTopMenu: FC<Props> = ({ children: [top, main] }) => {
  return (
    <div>
      <div className="pb-4 border-b border-slate-200">{top}</div>
      <div className="mt-4">{main}</div>
    </div>
  );
};
