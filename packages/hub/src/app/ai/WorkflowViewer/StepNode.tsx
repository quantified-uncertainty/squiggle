import clsx from "clsx";
import { FC, MouseEvent } from "react";

import { ClientStep } from "@quri/squiggle-ai";

import { StepStatusIcon } from "../StepStatusIcon";
import { stepNames } from "../utils";

type StepNodeProps = {
  data: ClientStep;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  isSelected?: boolean;
  stepNumber: number;
};

const getStepNodeClassName = (isSelected: boolean) =>
  clsx(
    "w-full cursor-pointer rounded-md border px-4 py-2 shadow-sm transition-colors",
    isSelected
      ? "border-slate-300 bg-slate-300"
      : "border-slate-200 bg-slate-100 hover:bg-slate-400"
  );

export const StepNode: FC<StepNodeProps> = ({
  data,
  onClick,
  isSelected = false,
  stepNumber,
}) => {
  return (
    <div className={getStepNodeClassName(isSelected)} onClick={onClick}>
      <div className="flex flex-col">
        <div className="mb-1 flex items-center justify-between gap-1">
          <div className="font-mono text-sm font-semibold text-slate-600">
            <span className="mr-1">{stepNumber}.</span>
            {stepNames[data.name] || data.name}
          </div>
          {data.state !== "DONE" && (
            <div className="shrink-0">
              <StepStatusIcon step={data} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
