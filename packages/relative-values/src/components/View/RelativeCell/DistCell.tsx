import { NumberShower } from "@quri/squiggle-components";
import { FC, memo } from "react";
import { CellBox } from "../CellBox";
import { Histogram } from "../Histogram";
import { RelativeValue } from "../hooks";

function numberToColor(rating: number){
  if (rating < 1.0) {
    return "text-gray-900"
  } else if (rating < 3.0) {
    return "text-gray-700"
  } else if (rating < 6.0) {
    return "text-yellow-700 opacity-90"
  } else if (rating < 9.0) {
    return "text-orange-700 opacity-70"
  } else {
    return "text-red-700 opacity-60" 
  }
};

function numberToColor2(rating: number){
  if (rating < 1.0) {
    return ""
  } else if (rating < 3.0) {
    return ""
  } else if (rating < 6.0) {
    return "bg-yellow-500 bg-opacity-5"
  } else if (rating < 9.0) {
    return "bg-orange-700 bg-opacity-5"
  } else {
    return "bg-red-400 bg-opacity-10" 
  }
};

export const DistCell: FC<{ item: RelativeValue }> = memo(function DistCell({
  item,
}) {
  return (
    <CellBox>
      <div className={`h-full pt-[1px] min-h-[2em] relative ${numberToColor2(item.db)}`}>
        <div className="text-center z-0 py-1">
          <div>
            <span className="text-slate-700 text-lg font-semibold">
              <NumberShower number={item.median} precision={1} />
            </span>
            {item.db === 0 ? null : (
              <span>
                {" "}
                <span style={{ fontSize: "0.7em"}} className="text-gray-400 font-light">±</span>{" "}
                <span className={`${numberToColor(item.db)}`}>
                  <NumberShower number={item.db} precision={1} />
                </span>
                <span style={{ fontSize: "0.6em"}} className={`${numberToColor(item.db)} font-light`}>dB</span>
              </span>
            )}
          </div>

          {item.db === 0 ? null : (
            <div style={{ fontSize: "0.7em"}} className="text-gray-400 font-light">
              <NumberShower number={item.min} precision={1}/> to{" "}
              <NumberShower number={item.max} precision={1} />
            </div>
          )}
        </div>

        {item.db === 0 ? null : (
          <div className="h-2 absolute bottom-0 inset-x-0 -z-10">
            <Histogram data={item.sortedSamples} domain={[1e-3, 1e3]} />
          </div>
        )}
      </div>
    </CellBox>
  );
});
