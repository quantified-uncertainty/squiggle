"use client";
import { FC, use } from "react";

import {
  defaultSquiggleVersion,
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
  versionSupportsSquiggleChart,
} from "@quri/versioned-squiggle-components";

import { EditSquiggleSnippetModel } from "@/app/models/[owner]/[slug]/EditSquiggleSnippetModel";
import { ModelFullDTO } from "@/models/data/full";
import { sqProjectWithHubLinker } from "@/squiggle/linker";

export const UpgradeableModel: FC<{
  model: ModelFullDTO;
}> = ({ model }) => {
  const currentRevision = model.currentRevision;

  const code = currentRevision.squiggleSnippet.code;

  const version = useAdjustSquiggleVersion(
    currentRevision.squiggleSnippet.version
  );
  const updatedVersion = defaultSquiggleVersion;

  const squiggle = use(versionedSquigglePackages(version));
  const updatedSquiggle = use(versionedSquigglePackages(updatedVersion));

  const project = sqProjectWithHubLinker(squiggle);
  const updatedProject = sqProjectWithHubLinker(updatedSquiggle);

  // TODO - compare outputs with compareVersions

  if (versionSupportsSquiggleChart.plain(version)) {
    const headerClasses = "py-1 px-2 m-1 bg-slate-200 font-medium";
    return (
      <div className="grid grid-cols-2">
        <div className={headerClasses}>{version}</div>
        <div className={headerClasses}>{updatedVersion}</div>
        <squiggle.components.SquiggleChart code={code} project={project} />
        <updatedSquiggle.components.SquiggleChart
          code={code}
          project={updatedProject}
        />
      </div>
    );
  } else {
    return (
      <EditSquiggleSnippetModel
        key={model.id}
        model={model}
        forceVersionPicker
      />
    );
  }
};
