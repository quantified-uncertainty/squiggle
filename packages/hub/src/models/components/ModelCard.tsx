import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { EntityCard } from "@/components/EntityCard";
import { ExportsDropdown, totalImportLength } from "@/lib/ExportsDropdown";
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
    currentRevision {
      exports {
        variableName
        variableType
        title
      }
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

  const modelExports = model.currentRevision.exports.map(
    ({ variableName, variableType, title }) => ({
      variableName,
      variableType,
      title: title || undefined,
    })
  );

  const relativeValuesExports = model.currentRevision.relativeValuesExports.map(
    ({ variableName, definition: { slug } }) => ({
      variableName,
      slug,
    })
  );

  const _totalImportLength = totalImportLength(
    modelExports,
    relativeValuesExports
  );

  return (
    <EntityCard
      updatedAtTimestamp={model.updatedAtTimestamp}
      href={modelUrl}
      showOwner={showOwner}
      isPrivate={model.isPrivate}
      ownerName={model.owner.slug}
      slug={model.slug}
    >
      {_totalImportLength > 0 && (
        <ExportsDropdown
          modelExports={modelExports}
          relativeValuesExports={relativeValuesExports}
          owner={model.owner.slug}
          slug={model.slug}
        >
          <div className="cursor-pointer items-center flex text-xs text-gray-500 hover:text-gray-900 hover:underline">
            {`${_totalImportLength} exports`}
          </div>
        </ExportsDropdown>
      )}
    </EntityCard>
  );
};
