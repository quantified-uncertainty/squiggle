import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { EntityCard } from "@/components/EntityCard";
import { modelExportRoute } from "@/routes";

import { ModelExportCard$key } from "@/__generated__/ModelExportCard.graphql";

const Fragment = graphql`
  fragment ModelExportCard on ModelExport {
    id
    variableName
    title
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
    />
  );
};
