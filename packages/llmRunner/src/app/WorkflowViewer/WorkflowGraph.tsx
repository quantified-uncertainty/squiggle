import { FC, useState } from "react";

import { StepDescription, WorkflowDescription } from "../utils/squiggleTypes";
import { StepNode } from "./StepNode";
import { SelectedNodeSideView } from "./StepNodeSideView";

export const WorkflowGraph: FC<{
  workflow: WorkflowDescription;
  height: number;
  onNodeClick?: (node: StepDescription) => void;
}> = ({ workflow, height, onNodeClick }) => {
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(
    null
  );

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
