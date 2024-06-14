"use client";
import { FC, use } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import {
  defaultSquiggleVersion,
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
  versionSupportsSquiggleChart,
} from "@quri/versioned-squiggle-components";

import { EditSquiggleSnippetModel } from "@/app/models/[owner]/[slug]/EditSquiggleSnippetModel";
import { squiggleHubLinker } from "@/squiggle/components/linker";

import { UpgradeableModel$key } from "@/__generated__/UpgradeableModel.graphql";

export const UpgradeableModel: FC<{
  modelRef: UpgradeableModel$key;
}> = ({ modelRef }) => {
  const model = useFragment(
    graphql`
      fragment UpgradeableModel on Model {
        id
        currentRevision {
          content {
            __typename
            ... on SquiggleSnippet {
              id
              code
              version
              seed
            }
          }
        }
        ...EditSquiggleSnippetModel
      }
    `,
    modelRef
  );

  const currentRevision = model.currentRevision;

  if (currentRevision.content.__typename !== "SquiggleSnippet") {
    throw new Error("Wrong content type");
  }

  const version = useAdjustSquiggleVersion(currentRevision.content.version);
  const updatedVersion = defaultSquiggleVersion;

  const squiggle = use(versionedSquigglePackages(version));
  const updatedSquiggle = use(versionedSquigglePackages(updatedVersion));

  const project = new squiggle.lang.SqProject({
    linker: squiggleHubLinker,
  });
  const updatedProject = new updatedSquiggle.lang.SqProject({
    linker: squiggleHubLinker,
  });

  // TODO - starting from 0.9.5, we will be able to compare serialized outputs for the new and old verison.

  if (versionSupportsSquiggleChart.plain(version)) {
    const headerClasses = "py-1 px-2 m-1 bg-slate-200 font-medium";
    return (
      <div className="grid grid-cols-2">
        <div className={headerClasses}>{version}</div>
        <div className={headerClasses}>{updatedVersion}</div>
        <squiggle.components.SquiggleChart
          code={currentRevision.content.code}
          project={project}
        />
        <updatedSquiggle.components.SquiggleChart
          code={currentRevision.content.code}
          project={updatedProject}
        />
      </div>
    );
  } else {
    return (
      <EditSquiggleSnippetModel
        key={model.id}
        modelRef={model}
        forceVersionPicker
      />
    );
  }
};
