import clsx from "clsx";
import { FC, useMemo } from "react";

import { ClientArtifact, ClientStep } from "@quri/squiggle-ai";
import { ChevronLeftIcon, ChevronRightIcon } from "@quri/ui";

import { useAvailableHeight } from "@/lib/hooks/useAvailableHeight";

import { SquigglePlaygroundForWorkflow } from "../SquigglePlaygroundForWorkflow";
import { stepNames } from "../utils";
import { ArtifactList } from "./ArtifactList";
import { ArtifactMessages } from "./ArtifactMessages";

const NavButton: FC<{
  onClick?: () => void;
  icon: React.ElementType;
  label: string;
}> = ({ onClick, icon: Icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "mr-2",
        onClick
          ? "text-slate-400 hover:text-slate-600"
          : "cursor-default text-slate-200"
      )}
      aria-label={label}
    >
      <Icon size={20} />
    </button>
  );
};

export const ClientStepView: FC<{
  step: ClientStep;
  onSelectPreviousStep?: () => void;
  onSelectNextStep?: () => void;
}> = ({ step, onSelectPreviousStep, onSelectNextStep }) => {
  const { ref, height } = useAvailableHeight();

  const selectedNodeCodeOutput = useMemo(() => {
    if (step.state.kind !== "DONE") {
      return undefined;
    }
    return Object.values(step.state.outputs).find(
      (output): output is ClientArtifact & { kind: "code" } =>
        output.kind === "code"
    );
  }, [step]);

  const maxPrimaryHeight = height ? height - 180 : 400;

  return (
    <div
      className="relative flex-1 overflow-y-auto bg-white p-4"
      key={step.id}
      ref={ref}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-600">
          {stepNames[step.name] || step.name}
        </h2>
        <div className="flex items-center">
          <NavButton
            onClick={onSelectPreviousStep}
            label="Previous Node"
            icon={ChevronLeftIcon}
          />
          <NavButton
            onClick={onSelectNextStep}
            label="Next Node"
            icon={ChevronRightIcon}
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <ArtifactList title="Inputs" artifacts={step.inputs} />
          </div>
          {step.state.kind === "DONE" && (
            <div className="flex-1">
              <ArtifactList title="Outputs" artifacts={step.state.outputs} />
            </div>
          )}
        </div>
        {step.state.kind === "FAILED" && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-red-800">Error</h3>
            <pre className="mb-4 whitespace-pre-wrap text-xs text-red-700">
              {step.state.message}
            </pre>
          </div>
        )}
        <div className="mt-4 flex gap-4">
          {selectedNodeCodeOutput && (
            <div className="flex flex-grow flex-col">
              <h3 className="mb-2 text-sm font-medium text-slate-500">
                Output Code:
              </h3>
              <div className="flex-grow overflow-hidden border border-slate-200">
                <SquigglePlaygroundForWorkflow
                  height={maxPrimaryHeight}
                  defaultCode={selectedNodeCodeOutput.value}
                />
              </div>
            </div>
          )}
          {step.messages.length > 0 && (
            <div className="flex w-1/4 min-w-[350px] flex-col">
              <h3 className="mb-2 text-sm font-medium text-slate-500">
                Messages:
              </h3>
              <div
                className="flex-grow overflow-y-auto"
                style={{ maxHeight: maxPrimaryHeight }}
              >
                <ArtifactMessages messages={step.messages} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
