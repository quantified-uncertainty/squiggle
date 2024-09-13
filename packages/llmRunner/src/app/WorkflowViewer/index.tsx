"use client";
import { FC } from "react";

import { Button, StyledTab } from "@quri/ui";

import { Badge } from "../Badge";
import { LogsView } from "../LogsView";
import SquigglePlayground from "../SquigglePlayground";
import { WorkflowDescription } from "../utils/squiggleTypes";
import { useAvailableHeight } from "../utils/useAvailableHeight";
import { Header } from "./Header";
import { WorkflowGraph } from "./WorkflowGraph";

export type Props<
  T extends WorkflowDescription["status"] = WorkflowDescription["status"],
> = {
  workflow: Extract<WorkflowDescription, { status: T }>;
  onFix: (code: string) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

const FinishedWorkflowViewer: FC<Props<"finished">> = ({
  workflow,
  onFix,
  expanded,
  setExpanded,
}) => {
  const { ref, height } = useAvailableHeight();

  const usedHeight = height ?? 200;

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
                <StyledTab name="Graph" />
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
              <SquigglePlayground
                height={usedHeight}
                defaultCode={workflow.result.code}
              />
            </StyledTab.Panel>
            <StyledTab.Panel>
              <WorkflowGraph workflow={workflow} height={usedHeight} />
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

const LoadingWorkflowViewer: FC<Props<"loading">> = ({
  workflow,
  expanded,
  setExpanded,
}) => {
  const { ref, height } = useAvailableHeight();

  const usedHeight = height ?? 200;

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
        <WorkflowGraph workflow={workflow} height={usedHeight} />
      </div>
    </div>
  );
};

export const WorkflowViewer: FC<Props> = ({ workflow, ...props }) => {
  switch (workflow.status) {
    case "finished":
      return <FinishedWorkflowViewer {...props} workflow={workflow} />;
    case "loading":
      return <LoadingWorkflowViewer {...props} workflow={workflow} />;
    case "error":
      return <div className="text-red-700">{workflow.result}</div>;
    default:
      throw workflow satisfies never;
  }
};