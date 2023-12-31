import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { CodeBracketIcon } from "@quri/ui";

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
      icon={CodeBracketIcon}
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
          <div className="flex">
            <div className="cursor-pointer group items-center flex hover:bg-slate-200 text-slate-500 rounded-md px-1 py-1 text-xs">
              <span className="mr-1.5 text-xs text-slate-700 bg-slate-200 group-hover:bg-slate-300 px-1 py-0.25 text-center rounded-full">
                {_totalImportLength}
              </span>
              Exports
            </div>
          </div>
        </ExportsDropdown>
      )}
    </EntityCard>
  );
};
