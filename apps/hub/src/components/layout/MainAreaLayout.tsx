import clsx from "clsx";
import { FC, PropsWithChildren, ReactNode, Suspense } from "react";
import Skeleton from "react-loading-skeleton";

export const MainAreaLayout: FC<
  PropsWithChildren<{
    title: string;
    actions?: ReactNode;
    theme?: "default" | "wide";
  }>
> = ({ children, title, actions, theme = "default" }) => {
  return (
    <div
      className={clsx("mx-auto my-8 px-4", theme === "default" && "max-w-4xl")}
    >
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      <Suspense fallback={<Skeleton count={10} height={24} />}>
        {children}
      </Suspense>
    </div>
  );
};
