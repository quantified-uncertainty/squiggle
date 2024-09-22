import { FC, useEffect, useRef, useState } from "react";

import { SerializedStep, SerializedWorkflow } from "@quri/squiggle-ai";

import { StepNode } from "./StepNode";
import { SelectedNodeSideView } from "./StepNodeSideView";

export const WorkflowActions: FC<{
  workflow: SerializedWorkflow;
  height: number;
  onNodeClick?: (node: SerializedStep) => void;
}> = ({ workflow, height, onNodeClick }) => {
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(0);
  const prevStepsLengthRef = useRef(workflow.steps.length);

  useEffect(() => {
    if (workflow.steps.length > prevStepsLengthRef.current) {
      setSelectedNodeIndex(workflow.steps.length - 2); // We want to select the last step, which is the one that just got finished. The new step won't have a result to show yet.
    }
    prevStepsLengthRef.current = workflow.steps.length;
  }, [workflow.steps]);

  const selectPreviousNode = () => {
    if (selectedNodeIndex !== null && selectedNodeIndex > 0) {
      setSelectedNodeIndex(selectedNodeIndex - 1);
      onNodeClick?.(workflow.steps[selectedNodeIndex - 1]);
    }
  };

  const selectNextNode = () => {
    if (
      selectedNodeIndex !== null &&
      selectedNodeIndex < workflow.steps.length - 1
    ) {
      setSelectedNodeIndex(selectedNodeIndex + 1);
      onNodeClick?.(workflow.steps[selectedNodeIndex + 1]);
    }
  };

  return (
    <div style={{ height }} className="flex">
      <div className={`w-70 flex flex-col`}>
        <div className="flex flex-col items-center space-y-2 p-2">
          {workflow.id}
          {workflow.steps.map((step, index) => (
            <StepNode
              data={step}
              onClick={() => {
                setSelectedNodeIndex(index);
                onNodeClick?.(step);
              }}
              isSelected={selectedNodeIndex === index}
              index={index}
              key={step.id}
            />
          ))}
        </div>
      </div>
      {selectedNodeIndex !== null && (
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
