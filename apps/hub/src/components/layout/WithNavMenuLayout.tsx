import { FC, PropsWithChildren, ReactNode } from "react";

export const WithNavMenuLayout: FC<
  PropsWithChildren<{
    menu: ReactNode;
  }>
> = ({ children, menu }) => {
  return (
    <div className="md:flex md:flex-1">
      <div className="border-b md:w-56 md:border-b-0 md:border-r md:border-slate-200">
        <div className="md:mt-4">{menu}</div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};
