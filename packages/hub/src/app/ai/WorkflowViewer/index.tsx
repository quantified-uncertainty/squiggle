"use client";
import { FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";
import { StyledTab } from "@quri/ui";

import { useAvailableHeight } from "@/hooks/useAvailableHeight";

import { LogsView } from "../LogsView";
import { SquigglePlaygroundForWorkflow } from "../SquigglePlaygroundForWorkflow";
import { Header } from "./Header";
import { WorkflowActions } from "./WorkflowActions";

type WorkflowViewerProps<
  T extends ClientWorkflow["status"] = ClientWorkflow["status"],
> = {
  workflow: Extract<ClientWorkflow, { status: T }>;
};

const StatsDisplay = ({
  runTimeMs,
  totalPrice,
  llmRunCount,
}: {
  runTimeMs: number;
  totalPrice: number;
  llmRunCount: number;
}) => {
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500">
      <span>{(runTimeMs / 1000).toFixed(2)}s</span>
      <span className="text-gray-300">|</span>
      <span>${totalPrice.toFixed(2)}</span>
      <span className="text-gray-300">|</span>
      <span>{llmRunCount} LLM runs</span>
    </div>
  );
};

const FinishedWorkflowViewer: FC<WorkflowViewerProps<"finished">> = ({
  workflow,
}) => {
  const { ref, height } = useAvailableHeight();
  const usedHeight = height ? height : 200;

  return (
    <StyledTab.Group>
      <div className="mt-2 flex flex-col gap-2">
        <Header
          workflow={workflow}
          renderLeft={() => (
            <StatsDisplay
              runTimeMs={workflow.result.runTimeMs}
              totalPrice={workflow.result.totalPrice}
              llmRunCount={workflow.result.llmRunCount}
            />
          )}
          renderRight={() => (
            <div className="flex gap-2">
              <StyledTab.List>
                <StyledTab name="Playground" />
                <StyledTab name="Actions" />
                <StyledTab name="Logs" />
              </StyledTab.List>
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
}) => {
  const { ref, height } = useAvailableHeight();
  const usedHeight = height ? height : 200;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <Header
        workflow={workflow}
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
