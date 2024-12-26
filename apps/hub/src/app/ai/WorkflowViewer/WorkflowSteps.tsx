import { FC, useEffect, useRef, useState } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";

import { StepListItem } from "./StepListItem";
import { StepView } from "./StepView";

export const WorkflowSteps: FC<{
  workflow: ClientWorkflow;
  height: number;
}> = ({ workflow, height }) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(
    workflow.steps.length - 1
  );
  const prevStepsLengthRef = useRef(workflow.steps.length);

  useEffect(() => {
    if (workflow.steps.length === prevStepsLengthRef.current) {
      return;
    }

    // select the last non-pending step
    for (let i = workflow.steps.length - 1; i >= 0; i--) {
      if (workflow.steps[i].state.kind !== "PENDING") {
        setSelectedStepIndex(i);
        break;
      }
    }

    prevStepsLengthRef.current = workflow.steps.length;
  }, [workflow.steps]);

  const selectPreviousStep =
    selectedStepIndex !== null && selectedStepIndex > 0
      ? () => {
          setSelectedStepIndex(selectedStepIndex - 1);
        }
      : undefined;

  const selectNextStep =
    selectedStepIndex !== null && selectedStepIndex < workflow.steps.length - 1
      ? () => {
          setSelectedStepIndex(selectedStepIndex + 1);
        }
      : undefined;

  const hasSelectedStep = !(
    selectedStepIndex === null || !workflow.steps[selectedStepIndex]
  );

  return (
    <div style={{ height }} className="flex">
      <div className="w-70">
        <div className="overflow-hidden rounded-lg">
          {workflow.steps.map((step, index) => (
            <StepListItem
              step={step}
              onClick={() => setSelectedStepIndex(index)}
              isSelected={selectedStepIndex === index}
              stepNumber={index + 1}
              key={step.id}
            />
          ))}
        </div>
      </div>
      {hasSelectedStep && (
        <StepView
          step={workflow.steps[selectedStepIndex]}
          onSelectPreviousStep={selectPreviousStep}
          onSelectNextStep={selectNextStep}
        />
      )}
    </div>
  );
};
