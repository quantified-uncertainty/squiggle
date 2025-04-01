import clsx from "clsx";
import { FC, PropsWithChildren, ReactNode, Suspense } from "react";
import Skeleton from "react-loading-skeleton";

import { H1 } from "../ui/Headers";

export const MainAreaLayout: FC<
  PropsWithChildren<{
    title: string;
    help?: ReactNode; // SmallHelp or ModalHelp
    actions?: ReactNode;
    theme?: "default" | "wide";
  }>
> = ({ children, title, help, actions, theme = "default" }) => {
  return (
    <div
      className={clsx("mx-auto my-8 px-4", theme === "default" && "max-w-4xl")}
    >
      <div className="mb-8 flex items-center justify-between">
        <H1>
          {title}
          {help && <> {help}</>}
        </H1>
        {actions && <div>{actions}</div>}
      </div>
      <Suspense fallback={<Skeleton count={10} height={24} />}>
        {children}
      </Suspense>
    </div>
  );
};
