import { z } from "zod";
import { clsx } from "clsx";
import { FC, Fragment, PropsWithChildren, useMemo } from "react";

import { SqRelativeValuesPlot } from "@quri/squiggle-lang";
import { DistCell } from "./DistCell.js";
import { SqLambda } from "@quri/squiggle-lang";
import { SqLambdaValue } from "@quri/squiggle-lang";
import { SqStringValue } from "@quri/squiggle-lang";
import { ErrorAlert } from "../Alert.js";
import { Env } from "@quri/squiggle-lang";

const rvSchema = z.object({
  median: z.number(),
  mean: z.number(),
  min: z.number(),
  max: z.number(),
  uncertainty: z.number(),
});

export const CellBox: FC<PropsWithChildren<{ header?: boolean }>> = ({
  children,
  header,
}) => (
  <div
    className={clsx(
      "border-t border-l border-gray-200 h-full",
      header && "bg-gray-50 top-0 left-0 z-10"
    )}
  >
    {children}
  </div>
);

const Header: FC<{ text: string }> = ({ text }) => (
  <div className="p-2 text-xs break-all">{text}</div>
);

const Cell: FC<{
  wrapFn: SqLambda;
  id1: string;
  id2: string;
  environment: Env;
}> = ({ wrapFn, id1, id2, environment }) => {
  const itemResult = wrapFn.directCall(
    [SqStringValue.create(id1), SqStringValue.create(id2)],
    environment
  );

  if (!itemResult.ok) {
    return <CellBox>Error</CellBox>;
  }
  const jsItem = itemResult.value.asJS();
  if (!(jsItem instanceof Map)) {
    return <CellBox>Error</CellBox>;
  }
  const item = rvSchema.parse(Object.fromEntries(jsItem.entries()));

  return (
    <CellBox>
      <DistCell item={item} showMedian={true} />
    </CellBox>
  );
};

type Props = {
  plot: SqRelativeValuesPlot;
  environment: Env;
};

export const RelativeValuesGridChart: FC<Props> = ({ plot, environment }) => {
  const ids = plot.ids;

  const wrapFnResult = useMemo(() => {
    return SqLambda.createFromStdlibName("RelativeValues.wrap").directCall(
      [SqLambdaValue.create(plot.fn)],
      environment
    );
  }, [plot.fn, environment]);

  if (!wrapFnResult.ok) {
    return <ErrorAlert heading="Failed to construct wrap function" />;
  }

  if (!(wrapFnResult.value instanceof SqLambdaValue)) {
    return (
      <ErrorAlert heading="Obtained invalid wrap function from RelativeValues.wrap" />
    );
  }

  const wrapFn = wrapFnResult.value.value;

  return (
    <div
      className="grid w-fit border-r border-b border-gray-200"
      style={{
        gridTemplateColumns: `repeat(${ids.length + 1}, 140px)`,
      }}
    >
      <div />
      {ids.map((columnId) => (
        <CellBox key={columnId} header>
          <Header text={columnId} />
        </CellBox>
      ))}
      {ids.map((rowId) => (
        <Fragment key={rowId}>
          <CellBox header>
            <Header text={rowId} />
          </CellBox>
          {ids.map((columnId) => (
            <Cell
              wrapFn={wrapFn}
              id1={rowId}
              id2={columnId}
              key={columnId}
              environment={environment}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
};
