"use client";
import { FC } from "react";

import { SerializedWorkflow } from "@quri/squiggle-ai";
import { Button, StyledTab } from "@quri/ui";

import { useAvailableHeight } from "@/hooks/useAvailableHeight";

import { Badge } from "../Badge";
import { LogsView } from "../LogsView";
import { SquigglePlaygroundForWorkflow } from "../SquigglePlaygroundForWorkflow";
import { Header } from "./Header";
import { WorkflowActions } from "./WorkflowActions";

type WorkflowViewerProps<
  T extends SerializedWorkflow["status"] = SerializedWorkflow["status"],
> = {
  workflow: Extract<SerializedWorkflow, { status: T }>;
  onFix: (code: string) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

const FinishedWorkflowViewer: FC<WorkflowViewerProps<"finished">> = ({
  workflow,
  onFix,
  expanded,
  setExpanded,
}) => {
  const { ref, height } = useAvailableHeight();
  const usedHeight = height ? height : 200;

  return (
    <StyledTab.Group>
      <div className="mt-2 flex flex-col gap-2">
        <Header
          workflow={workflow}
          expanded={expanded}
          setExpanded={setExpanded}
          renderLeft={() => (
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
          renderRight={() => (
            <div className="flex gap-2">
              <StyledTab.List>
                <StyledTab name="Playground" />
                <StyledTab name="Actions" />
                <StyledTab name="Logs" />
              </StyledTab.List>
              <Button
                theme="primary"
                onClick={() => onFix(workflow.result.code)}
              >
                Fix
              </Button>
            </div>
          )}
        />
        <div ref={ref}>
          <StyledTab.Panels>
            <StyledTab.Panel>
              <SquigglePlaygroundForWorkflow
                height={usedHeight}
                defaultCode={workflow.result.code}
              />
            </StyledTab.Panel>
            <StyledTab.Panel>
              <WorkflowActions workflow={workflow} height={usedHeight} />
            </StyledTab.Panel>
            <StyledTab.Panel>
              <LogsView logSummary={workflow.result.logSummary || ""} />
            </StyledTab.Panel>
          </StyledTab.Panels>
        </div>
      </div>
    </StyledTab.Group>
  );
};

const LoadingWorkflowViewer: FC<WorkflowViewerProps<"loading">> = ({
  workflow,
  expanded,
  setExpanded,
}) => {
  const { ref, height } = useAvailableHeight();
  const usedHeight = height ? height : 200;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <Header
        workflow={workflow}
        expanded={expanded}
        setExpanded={setExpanded}
        renderLeft={() => null}
        renderRight={() => null}
      />
      <div ref={ref}>
        <WorkflowActions workflow={workflow} height={usedHeight} />
      </div>
    </div>
  );
};

export const WorkflowViewer: FC<WorkflowViewerProps> = ({
  workflow,
  ...props
}) => {
  switch (workflow.status) {
    case "finished":
      return <FinishedWorkflowViewer {...props} workflow={workflow} />;
    case "loading":
      return <LoadingWorkflowViewer {...props} workflow={workflow} />;
    case "error":
      return (
        <div className="mt-2 rounded-md border border-red-300 bg-red-50 p-4">
          <h3 className="mb-2 text-lg font-semibold text-red-800">
            Server Error
          </h3>
          <p className="mb-4 text-red-700">{workflow.result}</p>
          <p className="text-sm text-red-600">
            Please try refreshing the page or attempt your action again.
          </p>
        </div>
      );
    default:
      throw workflow satisfies never;
  }
};
