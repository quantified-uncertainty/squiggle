"use client";
import clsx from "clsx";
import { FC, memo } from "react";

import type { RelativeValue } from "../../../values/types.js";
import { hasInvalid } from "../../../values/value.js";
import { FormattedNumber, uncertaintyNumber } from "../../host/format.js";
import { usePresentation } from "../../host/presentation.js";
import type {
  RelativeValuesCellDisplay,
  RelativeValuesNumberPlace,
} from "../../host/types.js";

function numberToTier(
  rating: number,
  percentiles: readonly [number, number] | undefined
) {
  if (!percentiles) {
    return 1;
  }
  const increment = (percentiles[1] - percentiles[0]) / 5;
  if (rating < percentiles[0] + increment) {
    return 1;
  } else if (rating < percentiles[0] + 2 * increment) {
    return 2;
  } else if (rating < percentiles[0] + 3 * increment) {
    return 3;
  } else if (rating < percentiles[0] + 4 * increment) {
    return 4;
  } else {
    return 5;
  }
}

function uncertaintyTextColor(tier: number) {
  switch (tier) {
    case 1:
      return "text-gray-900";
    case 2:
      return "text-gray-700";
    case 3:
      return "text-yellow-700 opacity-90";
    case 4:
      return "text-orange-700 opacity-70";
    default:
      return "text-red-700 opacity-60";
  }
}

function heatmapBackground(tier: number) {
  switch (tier) {
    case 1:
      return "hover:bg-gray-100";
    case 2:
      return "bg-yellow-300 bg-opacity-5 hover:bg-opacity-30";
    case 3:
      return "bg-yellow-500 bg-opacity-10 hover:bg-opacity-30";
    case 4:
      return "bg-red-400 bg-opacity-10 hover:bg-opacity-30";
    default:
      return "bg-red-400 bg-opacity-20 hover:bg-opacity-40";
  }
}

/**
 * A relative value: the median, the uncertainty ("± 0.4 om" or "×/÷ 2.5"),
 * and the 90% interval, depending on `display`; tinted by uncertainty.
 */
export const ValueCell: FC<{
  value: RelativeValue;
  display: RelativeValuesCellDisplay;
  uncertaintyPercentiles?: readonly [number, number];
  heatmap?: boolean;
  // False on the diagonal of the cluster diagram.
  showMedian?: boolean;
  place: RelativeValuesNumberPlace;
}> = memo(function ValueCell({
  value,
  display,
  uncertaintyPercentiles,
  heatmap = true,
  showMedian = true,
  place,
}) {
  const { format, labels, display: presentation } = usePresentation();
  const compact = presentation.density === "compact";
  if (hasInvalid(value)) {
    return (
      <div className="relative h-full min-h-[2em] bg-gray-300 bg-opacity-30 pt-[1px]">
        <div className="z-0 p-4 text-center text-gray-500">
          {labels["cell.error"]}
        </div>
      </div>
    );
  }
  const tier = numberToTier(value.uncertainty, uncertaintyPercentiles);
  const showUncertainty =
    display !== "value" && format.uncertainty !== "hidden";
  const uncertaintyColor = uncertaintyTextColor(tier);
  return (
    <div
      className={clsx(
        "relative h-full min-h-[2em] pt-[1px]",
        heatmap ? heatmapBackground(tier) : "hover:bg-gray-100"
      )}
    >
      <div
        className={clsx(
          "z-0 px-[var(--squiggle-rv-cell-padding,0px)] text-center",
          compact ? "py-0.5" : "py-1"
        )}
      >
        <div>
          {showMedian && (
            <span
              className={clsx(
                "font-semibold text-[color:var(--squiggle-rv-text,#334155)]",
                compact ? "text-base" : "text-lg"
              )}
            >
              <FormattedNumber
                format={format}
                value={value.median}
                kind="median"
                place={place}
              />
            </span>
          )}
          {showUncertainty && (
            <span>
              {showMedian && (
                <span>
                  {" "}
                  <span
                    style={{ fontSize: "0.7em" }}
                    className="font-light text-gray-400"
                  >
                    {format.uncertainty === "factor" ? "×/÷" : "±"}
                  </span>{" "}
                </span>
              )}
              <span className={uncertaintyColor}>
                <FormattedNumber
                  format={format}
                  value={uncertaintyNumber(format, value)}
                  kind="uncertainty"
                  place={place}
                />
              </span>
              {format.uncertainty === "om" && (
                <span
                  style={{ fontSize: "0.6em" }}
                  className={clsx(uncertaintyColor, "font-light")}
                >
                  {labels["cell.uncertaintyUnit"]}
                </span>
              )}
            </span>
          )}
        </div>

        {display === "full" && (
          <div
            style={{ fontSize: "0.7em" }}
            className="font-light text-[color:var(--squiggle-rv-muted,#9ca3af)]"
          >
            {value.min < 0 && value.max < 0 ? (
              <span>
                -(
                <FormattedNumber
                  format={format}
                  value={-1 * value.max}
                  kind="p95"
                  place={place}
                />{" "}
                {labels["cell.rangeSeparator"]}{" "}
                <FormattedNumber
                  format={format}
                  value={-1 * value.min}
                  kind="p5"
                  place={place}
                />
                )
              </span>
            ) : (
              <span>
                <FormattedNumber
                  format={format}
                  value={value.min}
                  kind="p5"
                  place={place}
                />{" "}
                {labels["cell.rangeSeparator"]}{" "}
                <FormattedNumber
                  format={format}
                  value={value.max}
                  kind="p95"
                  place={place}
                />
              </span>
            )}
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 -z-10 h-2"></div>
    </div>
  );
});
