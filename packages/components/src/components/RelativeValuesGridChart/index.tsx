import { clsx } from "clsx";
import { FC, Fragment, PropsWithChildren } from "react";

import { SqRelativeValuesPlot } from "@quri/squiggle-lang";
import { DistCell } from "./DistCell.js";

export const CellBox: FC<PropsWithChildren<{ header?: boolean }>> = ({
  children,
  header,
}) => (
  <div
    className={clsx(
      "border-t border-l border-gray-200 h-full p-2",
      header && "bg-gray-50 sticky top-0 left-0 z-10"
    )}
  >
    {children}
  </div>
);

type Props = {
  plot: SqRelativeValuesPlot;
};

export const RelativeValuesGridChart: FC<Props> = ({ plot }) => {
  const ids = plot.ids;
  return (
    <div
      className="grid border-r border-b border-gray-200"
      style={{
        gridTemplateColumns: `repeat(${ids.length + 1}, 140px)`,
      }}
    >
      <div />
      {ids.map((columnId) => (
        <CellBox key={columnId} header>
          {columnId}
        </CellBox>
      ))}
      {ids.map((rowId) => (
        <Fragment key={rowId}>
          <CellBox header>{rowId}</CellBox>
          {ids.map((columnId) => (
            <CellBox key={columnId}>
              TODO
              {/* call `RelativeValues.calculate` and render <DistCell> */}
              {/* <DistCell item={{}} /> */}
            </CellBox>
          ))}
        </Fragment>
      ))}
    </div>
  );
};
