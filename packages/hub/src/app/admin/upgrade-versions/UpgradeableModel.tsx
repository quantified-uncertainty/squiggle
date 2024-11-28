"use client";
import { FC, use, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

import {
  defaultSquiggleVersion,
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
  versionSupportsSquiggleChart,
} from "@quri/versioned-squiggle-components";

import { EditSquiggleSnippetModel } from "@/app/models/[owner]/[slug]/EditSquiggleSnippetModel";
import { loadModelFullAction } from "@/server/models/actions/loadModelFullAction";
import { ModelByVersion } from "@/server/models/data/byVersion";
import { ModelFullDTO } from "@/server/models/data/full";
import { sqProjectWithHubLinker } from "@/squiggle/components/linker";

const InnerUpgradeableModel: FC<{
  model: ModelFullDTO;
}> = ({ model }) => {
  const currentRevision = model.currentRevision;

  if (currentRevision.contentType !== "SquiggleSnippet") {
    throw new Error("Wrong content type");
  }

  const code = currentRevision.squiggleSnippet.code;

  const version = useAdjustSquiggleVersion(
    currentRevision.squiggleSnippet.version
  );
  const updatedVersion = defaultSquiggleVersion;

  const squiggle = use(versionedSquigglePackages(version));
  const updatedSquiggle = use(versionedSquigglePackages(updatedVersion));

  const project = sqProjectWithHubLinker(squiggle);
  const updatedProject = sqProjectWithHubLinker(updatedSquiggle);

  // TODO - starting from 0.9.5, we will be able to compare serialized outputs for the new and old verison.

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

export const UpgradeableModel: FC<{
  model: ModelByVersion["models"][number];
}> = ({ model: incompleteModel }) => {
  const [model, setModel] = useState<ModelFullDTO | "loading" | null>(
    "loading"
  );

  useEffect(() => {
    // TODO - this is done with a server action, so it's not cached.
    // A route would be better.
    loadModelFullAction({
      owner: incompleteModel.owner.slug,
      slug: incompleteModel.slug,
    }).then(setModel);
  }, []);

  if (model === "loading") {
    return <Skeleton height={160} />;
  }

  if (!model) {
    return <div>Model not found</div>;
  }

  return <InnerUpgradeableModel model={model} />;
};
