import { FC, PropsWithChildren, ReactNode } from "react";

export const WithMenuLayout: FC<
  PropsWithChildren<{
    menu: ReactNode;
  }>
> = ({ children, menu }) => {
  return (
    <div className="md:flex md:flex-1">
      <div className="border-b px-4 md:w-56 md:border-b-0 md:border-r md:border-slate-200">
        <div className="md:mt-8">{menu}</div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};
