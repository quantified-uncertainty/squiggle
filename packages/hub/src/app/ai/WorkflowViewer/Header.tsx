import { FC, ReactNode } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";
import { Button } from "@quri/ui";

import { WorkflowName } from "../WorkflowName";
import { WorkflowStatusIcon } from "../WorkflowStatusIcon";
import { ArtifactList } from "./ArtifactList";

// Common header for all workflow states
export const Header: FC<{
  renderLeft: () => ReactNode;
  renderRight: () => ReactNode;
  workflow: ClientWorkflow;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}> = ({ renderLeft, renderRight, workflow, expanded, setExpanded }) => {
  return (
    <div className="flex items-center justify-between rounded bg-gray-100 p-2">
      <div className="flex items-center gap-2">
        <div className="max-w-sm truncate text-sm font-medium">
          <WorkflowName workflow={workflow} />
        </div>
        <WorkflowStatusIcon workflow={workflow} />
        {renderLeft()}
        <ArtifactList artifacts={workflow.inputs} />
      </div>
      <div className="flex gap-2">
        {renderRight()}
        {expanded ? (
          <Button theme="primary" onClick={() => setExpanded(false)}>
            Close
          </Button>
        ) : (
          <Button onClick={() => setExpanded(true)}>Full View</Button>
        )}
      </div>
    </div>
  );
};
