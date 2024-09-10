"use client";
import { FC } from "react";

import { Button, StyledTab } from "@quri/ui";

import { Badge } from "./Badge";
import { LogsView } from "./LogsView";
import SquigglePlayground from "./SquigglePlayground";
import { WorkflowDescription } from "./utils/squiggleTypes";
import { useAvailableHeight } from "./utils/useAvailableHeight";

export const WorkflowViewer: FC<{
  workflow: WorkflowDescription;
  onFix: (code: string) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  inProgress: boolean;
}> = ({ workflow, onFix, expanded, setExpanded, inProgress }) => {
  const { ref, height } = useAvailableHeight();

  return (
    <div
      className="px-2"
      style={{
        opacity: inProgress ? 0.5 : 1,
        height: height || "auto",
      }}
      ref={ref}
    >
      <StyledTab.Group>
        <div className="mb-2 flex items-center justify-between rounded bg-gray-100 p-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Run</span>
            {workflow.status === "finished" && (
              <>
                <Badge theme="blue">
                  {(workflow.result.runTimeMs / 1000).toFixed(2)}s
                </Badge>
                <Badge theme="green">
                  ${workflow.result.totalPrice.toFixed(4)}
                </Badge>
                <Badge theme="purple">
                  {workflow.result.llmRunCount} LLM runs
                </Badge>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <StyledTab.List>
              <StyledTab name="Playground" />
              <StyledTab name="Logs" />
            </StyledTab.List>
            {workflow.status === "finished" && (
              <Button
                theme="primary"
                onClick={() => onFix(workflow.result.code)}
              >
                Fix
              </Button>
            )}
            {expanded ? (
              <Button theme="primary" onClick={() => setExpanded(false)}>
                Close
              </Button>
            ) : (
              <Button onClick={() => setExpanded(true)}>Full View</Button>
            )}
          </div>
        </div>
        <div className="mb-4 mt-2">
          <StyledTab.Panels>
            <StyledTab.Panel>
              {workflow.status === "finished" ? (
                <SquigglePlayground
                  height={height ? height - 60 : 200}
                  defaultCode={workflow.result.code}
                />
              ) : workflow.status === "error" ? (
                <div className="text-red-700">{workflow.result}</div>
              ) : (
                <div>No result yet</div>
              )}
            </StyledTab.Panel>
            <StyledTab.Panel>
              {workflow.status === "finished" ? (
                <LogsView logSummary={workflow.result.logSummary || ""} />
              ) : null}
            </StyledTab.Panel>
          </StyledTab.Panels>
        </div>
      </StyledTab.Group>
    </div>
  );
};
