"use client";
import { FC, ReactNode } from "react";
import { clsx } from "clsx";

import { EntityInfo, EntityNode } from "./EntityInfo";

export type { EntityNode };

type Props = {
  nodes: EntityNode[];
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
        className="border-gray-300 border-b"
        style={{ backgroundColor: "#eceef0" }}
      >
        <div
          className={clsx(
            "flex items-center justify-between gap-4 pt-1",
            !isFluid ? "max-w-4xl mx-auto" : "px-8"
          )}
        >
          <div className="flex items-center gap-2">
            <EntityInfo nodes={nodes} />
            {headerLeft}
          </div>
          <div>{headerRight}</div>
        </div>
      </div>
      <div className={clsx(!isFluid && "max-w-4xl mx-auto my-4")}>
        {children}
      </div>
    </div>
  );
};
