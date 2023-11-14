import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { CodeBracketIcon } from "@quri/ui";

import { ModelExportCard$key } from "@/__generated__/ModelExportCard.graphql";
import { EntityCard } from "@/components/EntityCard";
import { modelRoute } from "@/routes";
import { ExportsDropdown } from "@/lib/ExportsDropdown";

const Fragment = graphql`
  fragment ModelExportCard on Model {
    currentRevision {
      exports {
        variableName
        title
      }
    }
  }
`;

type Props = {
  modelRef: ModelExportCard$key;
  showOwner?: boolean;
};

export const ModelExportCard: FC<Props> = ({ modelRef, showOwner = true }) => {
  // const model = useFragment(Fragment, modelRef);
  // const rvExports = model.currentRevision.relativeValuesExports;
  // const exports = model.currentRevision.exports;

  // const modelUrl = modelRoute({
  //   owner: model.owner.slug,
  //   slug: model.slug,
  // });

  return "hi";
};
