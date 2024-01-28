import clsx from "clsx";
import { FC } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";

import { ModelCard } from "@/models/components/ModelCard";

import { parseSourceId } from "./linker";

import { ImportTooltipQuery } from "@/__generated__/ImportTooltipQuery.graphql";

type Props = {
  importId: string;
};

export const ImportTooltip: FC<Props> = ({ importId }) => {
  const { owner, slug } = parseSourceId(importId);

  const { model } = useLazyLoadQuery<ImportTooltipQuery>(
    graphql`
      query ImportTooltipQuery($input: QueryModelInput!) {
        model(input: $input) {
          __typename
          ... on Model {
            ...ModelCard
          }
        }
      }
    `,
    { input: { owner, slug } }
  );

  if (model.__typename !== "Model") {
    return (
      <div>
        {"Couldn't load "}
        {owner}/{slug}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "min-w-72",
        // reset font size from code editor; should this be done in <TooltipBox> from squiggle-components instead?
        "text-base"
      )}
    >
      <ModelCard modelRef={model} />
    </div>
  );
};
