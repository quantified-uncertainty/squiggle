import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { EntityCard } from "@/components/EntityCard";
import { groupRoute } from "@/routes";

import { ModelExportCard$key } from "@/__generated__/ModelExportCard.graphql";

const Fragment = graphql`
  fragment ModelExportCard on ModelExport {
    id
    variableName
  }
`;

type Props = {
  modelExportRef: ModelExportCard$key;
};

export const ModelExportCard: FC<Props> = ({ modelExportRef }) => {
  const modelExport = useFragment(Fragment, modelExportRef);

  return (
    <EntityCard
      updatedAtTimestamp={888898888}
      href={groupRoute({
        slug: "asd",
      })}
      showOwner={false}
      slug={modelExport.variableName}
    />
  );
};
