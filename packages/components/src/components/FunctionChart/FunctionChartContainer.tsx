import { SqLambda } from "@quri/squiggle-lang";
import React from "react";
import { FC, PropsWithChildren } from "react";

export const FunctionChartContainer: FC<
  PropsWithChildren<{ fn: SqLambda }>
> = ({ children, fn }) => (
  <div>
    <div className="text-amber-700 bg-amber-100 rounded-md font-mono p-1 pl-2 mb-3 mt-1 text-sm">{`function(${fn
      .parameters()
      .join(",")})`}</div>
    {children}
  </div>
);
