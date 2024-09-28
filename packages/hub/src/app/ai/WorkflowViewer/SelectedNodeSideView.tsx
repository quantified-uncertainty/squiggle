import clsx from "clsx";
import { FC, useMemo } from "react";

import { ClientArtifact, ClientStep } from "@quri/squiggle-ai";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "@quri/ui";

import { useAvailableHeight } from "@/hooks/useAvailableHeight";

import { SquigglePlaygroundForWorkflow } from "../SquigglePlaygroundForWorkflow";
import { ArtifactDisplay } from "./ArtifactDisplay";
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

const ArtifactList: FC<{
  title: string;
  artifacts: Record<string, ClientArtifact>;
}> = ({ title, artifacts }) => {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-500">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(artifacts).map(([key, value]) => (
          <ArtifactDisplay
            key={key}
            name={key}
            artifact={value}
            size={12}
            showArtifactName={true}
          />
        ))}
      </div>
    </div>
  );
};

export const SelectedNodeSideView: FC<{
  selectedNode: ClientStep;
  onClose: () => void;
  onSelectPreviousNode?: () => void;
  onSelectNextNode?: () => void;
}> = ({ selectedNode, onClose, onSelectPreviousNode, onSelectNextNode }) => {
  const { ref, height } = useAvailableHeight();

  const selectedNodeCodeOutput = useMemo(() => {
    return Object.values(selectedNode.outputs).find(
      (output): output is ClientArtifact & { kind: "code" } =>
        output.kind === "code"
    );
  }, [selectedNode]);

  const maxPrimaryHeight = height ? height - 180 : 400;

  return (
    <div
      className="relative flex-1 overflow-y-auto border-l border-slate-200 bg-white p-4"
      key={selectedNode.id}
      ref={ref}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-lg font-semibold text-slate-700">
          {selectedNode.name}
        </h2>
        <div className="flex items-center">
          <NavButton
            onClick={onSelectPreviousNode}
            label="Previous Node"
            icon={ChevronLeftIcon}
          />
          <NavButton
            onClick={onSelectNextNode}
            label="Next Node"
            icon={ChevronRightIcon}
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <ArtifactList title="Inputs" artifacts={selectedNode.inputs} />
          </div>
          <div className="flex-1">
            <ArtifactList title="Outputs" artifacts={selectedNode.outputs} />
          </div>
        </div>
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
          {selectedNode.messages.length > 0 && (
            <div className="flex w-1/4 min-w-[50px] flex-col">
              <h3 className="mb-2 text-sm font-medium text-slate-500">
                Messages:
              </h3>
              <div
                className="flex-grow overflow-y-auto"
                style={{ maxHeight: maxPrimaryHeight }}
              >
                <ArtifactMessages messages={selectedNode.messages} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
