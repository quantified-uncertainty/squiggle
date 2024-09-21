import { FC, useMemo } from "react";

import { SquigglePlayground } from "@quri/squiggle-components";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "@quri/ui";

import { linkerWithDefaultSquiggleLibs } from "../../llmRunner/CodeState";
import { ArtifactDescription, StepDescription } from "../utils/squiggleTypes";
import { useAvailableHeight } from "../utils/useAvailableHeight";
import { ArtifactDisplay, ArtifactMessages } from "./StepNodeHelpers";

export const SelectedNodeSideView: FC<{
  selectedNode: StepDescription;
  onClose: () => void;
  onSelectPreviousNode: () => void;
  onSelectNextNode: () => void;
}> = ({ selectedNode, onClose, onSelectPreviousNode, onSelectNextNode }) => {
  const { ref, height } = useAvailableHeight();

  const selectedNodeCodeOutput = useMemo(() => {
    return Object.values(selectedNode.outputs).find(
      (output): output is ArtifactDescription & { kind: "code" } =>
        output.kind === "code"
    );
  }, [selectedNode]);

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
          <button
            onClick={onSelectPreviousNode}
            className="mr-2 text-slate-400 hover:text-slate-600"
            aria-label="Previous Node"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <button
            onClick={onSelectNextNode}
            className="mr-2 text-slate-400 hover:text-slate-600"
            aria-label="Next Node"
          >
            <ChevronRightIcon size={20} />
          </button>
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
            <h3 className="mb-0.5 text-xs font-medium text-slate-500">
              Inputs:
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedNode.inputs).map(([key, value]) => (
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
          <div className="flex-1">
            <h3 className="mb-0.5 text-xs font-medium text-slate-500">
              Outputs:
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedNode.outputs).map(([key, value]) => (
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
        </div>
        {selectedNodeCodeOutput && (
          <div className="mt-4 border border-slate-200">
            <SquigglePlayground
              height={height ? height * 0.6 : 400}
              defaultCode={selectedNodeCodeOutput.value}
              linker={linkerWithDefaultSquiggleLibs}
            />
          </div>
        )}
        {selectedNode.messages.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-500">
              Messages:
            </h3>
            <ArtifactMessages messages={selectedNode.messages} />
          </div>
        )}
      </div>
    </div>
  );
};
