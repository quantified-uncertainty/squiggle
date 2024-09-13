import { FC, ReactNode } from "react";

import { Button } from "@quri/ui";

import { WorkflowDescription } from "../utils/squiggleTypes";
import { WorkflowStatusIcon } from "../WorkflowStatusIcon";

// Common header for all workflow states
export const Header: FC<{
  renderLeft: () => ReactNode;
  renderRight: () => ReactNode;
  workflow: WorkflowDescription;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}> = ({ renderLeft, renderRight, workflow, expanded, setExpanded }) => {
  return (
    <div className="flex items-center justify-between rounded bg-gray-100 p-2">
      <div className="flex items-center gap-2">
        <div className="max-w-sm truncate text-sm font-medium">
          {workflow.request.prompt}
        </div>
        <WorkflowStatusIcon workflow={workflow} />
        {renderLeft()}
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
