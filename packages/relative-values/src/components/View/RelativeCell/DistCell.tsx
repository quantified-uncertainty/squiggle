import { NumberShower } from "@quri/squiggle-components";
import { FC, memo } from "react";
import { CellBox } from "../CellBox";
import { Histogram } from "../Histogram";
import { RelativeValue } from "../hooks";

export const DistCell: FC<{ item: RelativeValue }> = memo(function DistCell({
  item,
}) {
  return (
    <CellBox>
      <div className="h-full pt-[1px] min-h-[2em] relative">
        <div className="text-center z-0 py-1">
          <div className="mb-0.5">
            <span className="text-lg">
              <NumberShower number={item.median} />
            </span>
            {item.db === 0 ? null : (
              <span>
                {" "}
                <span className="text-gray-400">±</span>{" "}
                <span className="text-gray-600">
                  <NumberShower number={item.db} />
                </span>
                <span className="text-gray-500 text-xs"> dB</span>
              </span>
            )}
          </div>

          {item.db === 0 ? null : (
            <div className="text-xs text-gray-500">
              <NumberShower number={item.min} /> to{" "}
              <NumberShower number={item.max} />
            </div>
          )}
        </div>

        {item.db === 0 ? null : (
          <div className="h-8 absolute bottom-0 inset-x-0 -z-10">
            <Histogram data={item.sortedSamples} domain={[1e-3, 1e3]} />
          </div>
        )}
      </div>
    </CellBox>
  );
});
