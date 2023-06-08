import { SqLambda } from "@quri/squiggle-lang";
import React from "react";
import { FC, PropsWithChildren } from "react";

export const FunctionChartContainer: FC<
  PropsWithChildren<{ fn: SqLambda }>
> = ({ children, fn }) => (
  <div>
    {children}
  </div>
);
