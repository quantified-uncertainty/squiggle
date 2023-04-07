import { RelativeValue } from "@/values/types";
import { hasInvalid } from "@/values/value";
import { NumberShower } from "@quri/squiggle-components";
import clsx from "clsx";
import { FC, memo } from "react";
import { CellBox } from "../CellBox";

function numberToTier(rating: number, percentiles: number[]) {
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

function numberToColor(rating: number, percentiles: number[]) {
  switch (numberToTier(rating, percentiles)) {
    case 1:
      return "text-gray-900";
    case 2:
      return "text-gray-700";
    case 3:
      return "text-yellow-700 opacity-90";
    case 4:
      return "text-orange-700 opacity-70";
    case 5:
      return "text-red-700 opacity-60";
  }
}

function numberToColor2(rating: number, percentiles: number[]) {
  switch (numberToTier(rating, percentiles)) {
    case 1:
      return "hover:bg-gray-100";
    case 2:
      return "bg-yellow-300 bg-opacity-5 hover:bg-opacity-30";
    case 3:
      return "bg-yellow-500 bg-opacity-10  hover:bg-opacity-30";
    case 4:
      return "bg-red-400 bg-opacity-10 hover:bg-opacity-30";
    case 5:
      return "bg-red-400 bg-opacity-20 hover:bg-opacity-40";
  }
}

export const DistCell: FC<{
  item: RelativeValue;
  uncertaintyPercentiles: number[];
}> = memo(function DistCell({ item, uncertaintyPercentiles }) {
  return (
    <CellBox>
      {hasInvalid(item) ? (
        <div
          className={`h-full pt-[1px] min-h-[2em] relative bg-gray-300 bg-opacity-30`}
        >
          <div className="text-center z-0 p-4 text-gray-500">Error</div>
        </div>
      ) : (
        <div
          className={`h-full pt-[1px] min-h-[2em] relative ${numberToColor2(
            item.uncertainty,
            uncertaintyPercentiles
          )}`}
        >
          <div className="text-center z-0 py-1">
            <div>
              <span className="text-slate-700 text-lg font-semibold">
                <NumberShower number={item.median} precision={1} />
              </span>
              <span>
                {" "}
                <span
                  style={{ fontSize: "0.7em" }}
                  className="text-gray-400 font-light"
                >
                  ±
                </span>{" "}
                <span
                  className={numberToColor(
                    item.uncertainty,
                    uncertaintyPercentiles
                  )}
                >
                  <NumberShower number={item.uncertainty} precision={2} />
                </span>
                <span
                  style={{ fontSize: "0.6em" }}
                  className={clsx(
                    numberToColor(item.uncertainty, uncertaintyPercentiles),
                    "font-light"
                  )}
                >
                  om
                </span>
              </span>
            </div>

            <div
              style={{ fontSize: "0.7em" }}
              className="text-gray-400 font-light"
            >
              {item.min < 0 && item.max < 0 ? (
                <span>
                  -(
                  <NumberShower number={-1 * item.max} precision={1} /> to{" "}
                  <NumberShower number={-1 * item.min} precision={1} />)
                </span>
              ) : (
                <span>
                  <NumberShower number={item.min} precision={1} /> to{" "}
                  <NumberShower number={item.max} precision={1} />
                </span>
              )}
            </div>
          </div>

          <div className="h-2 absolute bottom-0 inset-x-0 -z-10"></div>
        </div>
      )}
    </CellBox>
  );
});
