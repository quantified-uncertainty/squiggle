"use client";

import { FC } from "react";
import { graphql } from "relay-runtime";

import { StyledLink } from "@/components/ui/StyledLink";
import { commonDateFormat } from "@/lib/common";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelRoute } from "@/routes";
import QueryNode, {
  ModelRevisionViewQuery,
} from "@gen/ModelRevisionViewQuery.graphql";
import { SquigglePlayground } from "@quri/squiggle-components";
import { format } from "date-fns";
import { useOwner } from "@/hooks/Owner";

const Query = graphql`
  query ModelRevisionViewQuery($input: QueryModelInput!, $revisionId: ID!) {
    result: model(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on Model {
        id
        slug
        owner {
          ...Owner
        }
        revision(id: $revisionId) {
          createdAtTimestamp
          content {
            __typename
            ... on SquiggleSnippet {
              code
            }
          }
        }
      }
    }
  }
`;

export const ModelRevisionView: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, ModelRevisionViewQuery>;
}> = ({ query }) => {
  const [{ result }] = usePageQuery(Query, query);
  const model = extractFromGraphqlErrorUnion(result, "Model");
  const owner = useOwner(model.owner);

  const modelUrl = modelRoute({
    owner,
    slug: model.slug,
  });

  const typename = model.revision.content.__typename;
  if (typename !== "SquiggleSnippet") {
    return <div>Unknown model type {typename}</div>;
  }

  return (
    <div>
      <div className="border-b border-gray-300">
        <div className="pt-4 pb-8 px-8">
          <div>
            <span className="text-slate-500">Version from</span>{" "}
            {format(model.revision.createdAtTimestamp, commonDateFormat)}
          </div>
          <StyledLink href={modelUrl}>Go to latest version</StyledLink>
        </div>
      </div>
      <SquigglePlayground defaultCode={model.revision.content.code} />
    </div>
  );
};
