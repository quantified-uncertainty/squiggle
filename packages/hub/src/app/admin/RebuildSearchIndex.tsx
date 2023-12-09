import { RebuildSearchIndexMutation } from "@/__generated__/RebuildSearchIndexMutation.graphql";
import { H2 } from "@/components/ui/Headers";
import { MutationButton } from "@/components/ui/MutationButton";
import { FC } from "react";
import { graphql } from "relay-runtime";

export const RebuildSearchIndex: FC = () => {
  return (
    <div>
      <H2>Rebuild search index</H2>
      <MutationButton<
        RebuildSearchIndexMutation,
        "AdminRebuildSearchIndexResult"
      >
        mutation={graphql`
          mutation RebuildSearchIndexMutation {
            result: adminRebuildSearchIndex {
              __typename
              ... on BaseError {
                message
              }
              ... on AdminRebuildSearchIndexResult {
                ok
              }
            }
          }
        `}
        expectedTypename="AdminRebuildSearchIndexResult"
        title="Rebuild"
        confirmation="Index updated"
        theme="primary"
        variables={{}}
      />
    </div>
  );
};
