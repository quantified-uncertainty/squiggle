import clsx from "clsx";
import { FC, MouseEvent } from "react";

import { SerializedStep } from "@quri/squiggle-ai";

import { StepStatusIcon } from "../StepStatusIcon";
import { ArtifactDisplay } from "./StepNodeHelpers";

export const StepNode: FC<{
  data: SerializedStep;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  isSelected?: boolean;
  index: number;
}> = ({ data, onClick, isSelected, index }) => {
  return (
    <div
      className={clsx(
        "w-full cursor-pointer rounded-md border px-4 py-2 shadow-sm transition-colors",
        isSelected
          ? "border-emerald-300 bg-emerald-100 hover:bg-emerald-200"
          : "border-slate-200 bg-slate-100 hover:bg-slate-300"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {data.state !== "DONE" && (
              <div className="shrink-0">
                <StepStatusIcon step={data} />
              </div>
            )}
            <div className="font-mono text-sm font-semibold text-slate-600">
              <span className="mr-1 text-slate-400">{index + 1}.</span>
              {data.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(data.outputs).map(([key, value]) => (
              <ArtifactDisplay
                key={key}
                name={key}
                artifact={value}
                size={12}
                showArtifactName={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
