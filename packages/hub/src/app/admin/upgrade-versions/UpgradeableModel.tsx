"use client";
import { FC, use } from "react";
import { useFragment, useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import {
  defaultSquiggleVersion,
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
  versionSupportsSquiggleChart,
} from "@quri/versioned-squiggle-components";

import { EditSquiggleSnippetModel } from "@/app/models/[owner]/[slug]/EditSquiggleSnippetModel";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { squiggleHubLinker } from "@/squiggle/components/linker";

import { UpgradeableModel_Ref$key } from "@/__generated__/UpgradeableModel_Ref.graphql";
import { UpgradeableModelQuery } from "@/__generated__/UpgradeableModelQuery.graphql";

export const UpgradeableModel: FC<{
  modelRef: UpgradeableModel_Ref$key;
}> = ({ modelRef }) => {
  const incompleteModel = useFragment(
    graphql`
      fragment UpgradeableModel_Ref on Model {
        id
        slug
        owner {
          id
          slug
        }
      }
    `,
    modelRef
  );

  const result = useLazyLoadQuery<UpgradeableModelQuery>(
    graphql`
      query UpgradeableModelQuery($input: QueryModelInput!) {
        model(input: $input) {
          __typename
          ... on Model {
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
        }
      }
    `,
    {
      input: {
        slug: incompleteModel.slug,
        owner: incompleteModel.owner.slug,
      },
    }
  );

  const model = extractFromGraphqlErrorUnion(result.model, "Model");

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
