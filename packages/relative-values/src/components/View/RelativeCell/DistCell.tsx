import { RelativeValue } from "@/values/types";
import { NumberShower } from "@quri/squiggle-components";
import { FC, memo } from "react";
import { CellBox } from "../CellBox";

function numberToColor(rating: number, percentiles: number[]) {
  if (rating < percentiles[0]) {
    return "text-gray-900";
  } else if (rating < percentiles[1]) {
    return "text-gray-700";
  } else if (rating < percentiles[2]) {
    return "text-yellow-700 opacity-90";
  } else if (rating < percentiles[3]) {
    return "text-orange-700 opacity-70";
  } else {
    return "text-red-700 opacity-60";
  }
}

function numberToColor2(rating: number, percentiles: number[]) {
  if (rating < percentiles[0]) {
    return "";
  } else if (rating < percentiles[1]) {
    return "bg-yellow-800 bg-opacity-5";
  } else if (rating < percentiles[2]) {
    return "bg-yellow-600 bg-opacity-5";
  } else if (rating < percentiles[3]) {
    return "bg-orange-700 bg-opacity-5";
  } else {
    return "bg-red-400 bg-opacity-10";
  }
}

export const DistCell: FC<{ item: RelativeValue, percentiles: number[] }> = memo(function DistCell({
  item,
  percentiles
}) {
  return (
    <CellBox>
      <div
        className={`h-full pt-[1px] min-h-[2em] relative ${numberToColor2(
          item.db,
          percentiles
        )}`}
      >
        <div className="text-center z-0 py-1">
          <div>
            <span className="text-slate-700 text-lg font-semibold">
              <NumberShower number={item.median} precision={1} />
            </span>
            {item.db === 0 ? null : (
              <span>
                {" "}
                <span
                  style={{ fontSize: "0.7em" }}
                  className="text-gray-400 font-light"
                >
                  ±
                </span>{" "}
                <span className={`${numberToColor(item.db, percentiles)}`}>
                  <NumberShower number={item.db} precision={2} />
                </span>
                <span
                  style={{ fontSize: "0.6em" }}
                  className={`${numberToColor(item.db, percentiles)} font-light`}
                >
                  om
                </span>
              </span>
            )}
          </div>

          {item.db === 0 ? null : (
            <div
              style={{ fontSize: "0.7em" }}
              className="text-gray-400 font-light"
            >
              <NumberShower number={item.min} precision={1} /> to{" "}
              <NumberShower number={item.max} precision={1} />
            </div>
          )}
        </div>

        {item.db === 0 ? null : (
          <div className="h-2 absolute bottom-0 inset-x-0 -z-10"></div>
        )}
      </div>
    </CellBox>
  );
});
