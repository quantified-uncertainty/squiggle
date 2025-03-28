import clsx from "clsx";
import { FC, PropsWithChildren, ReactNode } from "react";

export const FrontpageMainAreaLayout: FC<
  PropsWithChildren<{
    title: string;
    actions?: ReactNode;
    theme?: "default" | "wide";
  }>
> = ({ children, title, actions, theme = "default" }) => {
  return (
    <div
      className={clsx(
        "mx-auto mb-8 mt-8 max-w-4xl px-2",
        theme === "wide" && "max-w-6xl"
      )}
    >
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  );
};
