"use client";
import { format } from "date-fns";
import { Children, FC } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";
import { ErrorIcon, StyledTab, TextTooltip } from "@quri/ui";

import { commonDateFormat } from "@/lib/constants";
import { useAvailableHeight } from "@/lib/hooks/useAvailableHeight";

import { LogsView } from "../LogsView";
import { SquigglePlaygroundForWorkflow } from "../SquigglePlaygroundForWorkflow";
import { isWorkflowOutdated } from "../WorkflowSummaryList/WorkflowStatusIcon";
import { Header } from "./Header";
import { PublishWorkflowButton } from "./PublishWorkflowButton";
import { WorkflowSteps } from "./WorkflowSteps";

type WorkflowViewerProps<
  T extends ClientWorkflow["status"] = ClientWorkflow["status"],
> = {
  workflow: Extract<ClientWorkflow, { status: T }>;
};

const LineSeparatedList: FC<{ children: React.ReactNode }> = ({ children }) => {
  const childrenArray = Children.toArray(children);
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {childrenArray.flatMap((child, index) => [
        index > 0 && (
          <div key={`${index}-separator`} className="text-gray-300">
            |
          </div>
        ),
        <div key={index}>{child}</div>,
      ])}
    </div>
  );
};

const WorkflowDate: FC<{ workflow: ClientWorkflow }> = ({ workflow }) => {
  return <span>{format(workflow.timestamp, commonDateFormat)}</span>;
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
            <div className="flex items-center gap-2">
              <LineSeparatedList>
                <span>{(workflow.result.runTimeMs / 1000).toFixed(2)}s</span>
                <span>${workflow.result.totalPrice.toFixed(2)}</span>
                <span>{workflow.result.llmRunCount} LLM runs</span>
                <WorkflowDate workflow={workflow} />
              </LineSeparatedList>
              {workflow.result.error ? (
                <div className="flex items-center gap-1">
                  <TextTooltip text={workflow.result.error}>
                    <span>
                      <ErrorIcon
                        className="cursor-pointer text-red-400"
                        size={16}
                      />
                    </span>
                  </TextTooltip>
                </div>
              ) : null}
            </div>
          )}
          renderRight={() => (
            <div className="flex items-center gap-2">
              <PublishWorkflowButton workflow={workflow} />
              <StyledTab.List>
                <StyledTab name="Playground" />
                <StyledTab name="Steps" />
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
              <WorkflowSteps workflow={workflow} height={usedHeight} />
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
        renderLeft={() => (
          <LineSeparatedList>
            <WorkflowDate workflow={workflow} />
          </LineSeparatedList>
        )}
        renderRight={() => {
          if (isWorkflowOutdated(workflow)) {
            return (
              <div className="flex items-center gap-1">
                <ErrorIcon className="text-red-400" size={16} />
                <span className="text-sm font-medium text-red-400">
                  Timed Out
                </span>
              </div>
            );
          }
          return null;
        }}
      />
      <div ref={ref}>
        <WorkflowSteps workflow={workflow} height={usedHeight} />
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
    default:
      throw workflow satisfies never;
  }
};
