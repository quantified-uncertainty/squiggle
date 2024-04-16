"use client";
import { clsx } from "clsx";
import { FC, ReactNode } from "react";

import { EntityNode } from "./EntityInfo";

export type { EntityNode };

type Props = {
  nodes: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children?: ReactNode;
  isFluid?: boolean;
};

export const EntityLayout: FC<Props> = ({
  nodes,
  headerLeft,
  headerRight,
  children,
  isFluid = false,
}) => {
  return (
    <div>
      <div
        className="border-b border-gray-300"
        style={{ backgroundColor: "#eceef0" }}
      >
        <div
          className={clsx(
            "flex items-center justify-between gap-4 pt-1",
            !isFluid ? "mx-auto max-w-4xl" : "px-8"
          )}
        >
          <div className="flex items-center gap-2">
            {nodes}
            {headerLeft}
          </div>
          <div>{headerRight}</div>
        </div>
      </div>
      <div className={clsx(!isFluid && "mx-auto my-4 max-w-4xl")}>
        {children}
      </div>
    </div>
  );
};
