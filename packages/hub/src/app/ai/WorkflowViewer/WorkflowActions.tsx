import { FC, useEffect, useRef, useState } from "react";

import { ClientStep, ClientWorkflow } from "@quri/squiggle-ai";

import { SelectedNodeSideView } from "./SelectedNodeSideView";
import { StepNode } from "./StepNode";

export const WorkflowActions: FC<{
  workflow: ClientWorkflow;
  height: number;
  onNodeClick?: (node: ClientStep) => void;
}> = ({ workflow, height, onNodeClick }) => {
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(
    workflow.steps.length - 1
  );
  const prevStepsLengthRef = useRef(workflow.steps.length);

  useEffect(() => {
    if (workflow.steps.length === prevStepsLengthRef.current) {
      return;
    }

    // select the last non-pending step
    for (let i = workflow.steps.length - 1; i >= 0; i--) {
      if (workflow.steps[i].state !== "PENDING") {
        setSelectedNodeIndex(i);
        break;
      }
    }

    prevStepsLengthRef.current = workflow.steps.length;
  }, [workflow.steps]);

  const selectPreviousNode =
    selectedNodeIndex !== null && selectedNodeIndex > 0
      ? () => {
          setSelectedNodeIndex(selectedNodeIndex - 1);
          onNodeClick?.(workflow.steps[selectedNodeIndex - 1]);
        }
      : undefined;

  const selectNextNode =
    selectedNodeIndex !== null && selectedNodeIndex < workflow.steps.length - 1
      ? () => {
          setSelectedNodeIndex(selectedNodeIndex + 1);
          onNodeClick?.(workflow.steps[selectedNodeIndex + 1]);
        }
      : undefined;

  const hasSelectedNode = !(
    selectedNodeIndex === null || !workflow.steps[selectedNodeIndex]
  );

  return (
    <div style={{ height }} className="flex">
      <div className="w-70">
        <div className="overflow-hidden rounded-lg">
          {workflow.steps.map((step, index) => (
            <StepNode
              data={step}
              onClick={() => {
                setSelectedNodeIndex(index);
                onNodeClick?.(step);
              }}
              isSelected={selectedNodeIndex === index}
              stepNumber={index + 1}
              key={step.id}
            />
          ))}
        </div>
      </div>
      {hasSelectedNode && (
        <SelectedNodeSideView
          selectedNode={workflow.steps[selectedNodeIndex]}
          onClose={() => setSelectedNodeIndex(null)}
          onSelectPreviousNode={selectPreviousNode}
          onSelectNextNode={selectNextNode}
        />
      )}
    </div>
  );
};
