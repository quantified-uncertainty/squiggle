import { FC, PropsWithChildren, ReactNode } from "react";

export const FrontpageMainAreaLayout: FC<
  PropsWithChildren<{
    title: string;
    actions?: ReactNode;
  }>
> = ({ children, title, actions }) => {
  return (
    <div className="mx-auto mb-8 mt-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  );
};
