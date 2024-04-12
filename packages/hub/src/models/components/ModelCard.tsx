import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { EntityCard } from "@/components/EntityCard";
import { totalImportLength, VariablesDropdown } from "@/lib/VariablesDropdown";
import { modelRoute } from "@/routes";

import { ModelCard$key } from "@/__generated__/ModelCard.graphql";

const Fragment = graphql`
  fragment ModelCard on Model {
    id
    slug
    updatedAtTimestamp
    owner {
      slug
    }
    isPrivate
    variables {
      variableName
      lastRevision {
        variableType
        title
      }
    }
    currentRevision {
      relativeValuesExports {
        variableName
        definition {
          slug
        }
      }
    }
  }
`;

type Props = {
  modelRef: ModelCard$key;
  showOwner?: boolean;
};

export const ModelCard: FC<Props> = ({ modelRef, showOwner = true }) => {
  const model = useFragment(Fragment, modelRef);

  const modelUrl = modelRoute({
    owner: model.owner.slug,
    slug: model.slug,
  });

  const modelVariables = model.currentRevision.variables.map((v) => ({
    variableName: v.variableName,
    variableType: v.lastRevision?.variableType,
    title: v.lastRevision?.title || undefined,
  }));

  const relativeValuesExports = model.currentRevision.relativeValuesExports.map(
    ({ variableName, definition: { slug } }) => ({
      variableName,
      slug,
    })
  );

  const _totalImportLength = totalImportLength(
    modelVariables,
    relativeValuesExports
  );

  const footerItems =
    _totalImportLength > 0 ? (
      <VariablesDropdown
        modelVariables={modelVariables}
        relativeValuesVariables={relativeValuesVariables}
        owner={model.owner.slug}
        slug={model.slug}
      >
        <div className="cursor-pointer items-center flex text-xs text-gray-500 hover:text-gray-900 hover:underline">
          {`${_totalImportLength} variables`}
        </div>
      </VariablesDropdown>
    ) : undefined;

  return (
    <EntityCard
      updatedAtTimestamp={model.updatedAtTimestamp}
      href={modelUrl}
      showOwner={showOwner}
      isPrivate={model.isPrivate}
      ownerName={model.owner.slug}
      slug={model.slug}
      footerItems={footerItems}
    />
  );
};
