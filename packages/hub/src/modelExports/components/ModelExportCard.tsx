import truncate from "lodash/truncate";
import { FC } from "react";
import ReactMarkdown from "react-markdown";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import remarkGfm from "remark-gfm";

import { EntityCard } from "@/components/EntityCard";
import { exportTypeIcon } from "@/lib/typeIcon";
import { modelExportRoute, modelRoute } from "@/routes";

import { ModelExportCard$key } from "@/__generated__/ModelExportCard.graphql";

const Fragment = graphql`
  fragment ModelExportCard on ModelExport {
    id
    variableName
    title
    docstring
    variableType
    owner {
      slug
    }
    modelRevision {
      createdAtTimestamp
      model {
        slug
      }
    }
  }
`;

type Props = {
  modelExportRef: ModelExportCard$key;
};

export const ModelExportCard: FC<Props> = ({ modelExportRef }) => {
  const modelExport = useFragment(Fragment, modelExportRef);

  const Icon = exportTypeIcon(modelExport.variableType);

  // This will have problems with markdown tags, but I looked into markdown-truncation packages, and they can get complicated. Will try this for now.
  const docstring =
    (modelExport.docstring &&
      truncate(modelExport.docstring, {
        length: 500,
        separator: " ",
        omission: "...",
      })) ||
    undefined;

  return (
    <EntityCard
      updatedAtTimestamp={modelExport.modelRevision.createdAtTimestamp}
      href={modelExportRoute({
        modelSlug: modelExport.modelRevision.model.slug,
        variableName: modelExport.variableName,
        owner: modelExport.owner.slug,
      })}
      showOwner={false}
      slug={modelExport.title || modelExport.variableName}
      footerItems={
        <>
          <a
            className="cursor-pointer items-center flex text-xs text-gray-500 hover:text-gray-900 hover:underline"
            href={modelRoute({
              owner: modelExport.owner.slug,
              slug: modelExport.modelRevision.model.slug,
            })}
          >
            {`${modelExport.owner.slug}/${modelExport.modelRevision.model.slug}`}
          </a>
          <div className="items-center flex text-xs text-gray-500">
            <Icon size={10} className="mr-1" />
            {modelExport.variableType}
          </div>
        </>
      }
    >
      {docstring && (
        <ReactMarkdown
          className={"prose text-sm text-gray-500"}
          remarkPlugins={[remarkGfm]}
        >
          {docstring}
        </ReactMarkdown>
      )}
    </EntityCard>
  );
};
