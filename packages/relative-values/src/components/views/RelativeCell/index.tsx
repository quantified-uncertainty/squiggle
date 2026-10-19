"use client";
import clsx from "clsx";
import { FC, memo } from "react";

import type { Item } from "../../../types.js";
import type { RelativeValueResult } from "../../../values/types.js";
import { usePresentation } from "../../host/presentation.js";
import { renderSlot } from "../../host/slots.js";
import type {
  RelativeValuesCellDisplay,
  RelativeValuesCellProps,
} from "../../host/types.js";
import { CellBox } from "../CellBox.js";
import { ErrorCell } from "./ErrorCell.js";
import { ValueCell } from "./ValueCell.js";

/** The built-in cell (the `Default` of the `Cell` slot). */
export const DefaultCell: FC<RelativeValuesCellProps> = ({
  result,
  display,
  uncertaintyPercentiles,
  place,
}) => {
  const { display: presentation } = usePresentation();
  if (!result.ok) {
    return <ErrorCell error={result.value} />;
  }
  return (
    <CellBox>
      <ValueCell
        value={result.value}
        display={display}
        uncertaintyPercentiles={uncertaintyPercentiles}
        heatmap={place === "list" || presentation.grid.heatmap}
        place={place}
      />
    </CellBox>
  );
};

/** A cell of the list or the grid, through the `Cell` slot. */
export const RelativeCell: FC<{
  numerator: Item;
  denominator: Item;
  // Undefined while not computed.
  result: RelativeValueResult | undefined;
  display: RelativeValuesCellDisplay;
  uncertaintyPercentiles: readonly [number, number];
  place: "list" | "grid";
  selected?: boolean;
}> = memo(function RelativeCell({
  numerator,
  denominator,
  result,
  display,
  uncertaintyPercentiles,
  place,
  selected,
}) {
  const { components } = usePresentation();
  return (
    <div
      className={clsx(
        "h-full",
        selected &&
          "bg-[var(--squiggle-rv-selected-bg,#f1f5f9)] ring-2 ring-inset ring-[color:var(--squiggle-rv-accent,#64748b)]"
      )}
      data-rv-selected={selected ? "" : undefined}
    >
      {result === undefined ? (
        <CellBox>
          <div className="min-h-[2em] py-1 text-center text-gray-300">…</div>
        </CellBox>
      ) : (
        renderSlot(components.Cell, DefaultCell, {
          numerator,
          denominator,
          result,
          display,
          uncertaintyPercentiles,
          place,
        })
      )}
    </div>
  );
});
