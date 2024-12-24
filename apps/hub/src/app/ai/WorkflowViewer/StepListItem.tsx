import clsx from "clsx";
import { FC, MouseEvent } from "react";

import { ClientStep } from "@quri/squiggle-ai";

import { StepStatusIcon } from "../StepStatusIcon";
import { stepNames } from "../utils";

type Props = {
  step: ClientStep;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  isSelected?: boolean;
  stepNumber: number;
};

const getStepNodeClassName = (isSelected: boolean) =>
  clsx(
    "w-full cursor-pointer px-4 py-1.5 transition-colors",
    isSelected ? "bg-slate-200" : "bg-slate-50 hover:bg-slate-100"
  );

export const StepListItem: FC<Props> = ({
  step,
  onClick,
  isSelected = false,
  stepNumber,
}) => {
  return (
    <div className={getStepNodeClassName(isSelected)} onClick={onClick}>
      <div className="flex items-center justify-between gap-1">
        <div className="text-sm font-medium text-slate-600">
          <span className="mr-1 text-slate-400">{stepNumber}.</span>
          {stepNames[step.name] || step.name}
        </div>
        {step.state.kind !== "DONE" && (
          <div className="shrink-0">
            <StepStatusIcon step={step} />
          </div>
        )}
      </div>
    </div>
  );
};
