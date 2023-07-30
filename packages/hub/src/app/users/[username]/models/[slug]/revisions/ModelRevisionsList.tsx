"use client";
import { format } from "date-fns";
import { FC } from "react";
import { usePaginationFragment, usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { Button } from "@quri/ui";

import { ModelRevisionsList$key } from "@/__generated__/ModelRevisionsList.graphql";
import { StyledLink } from "@/components/ui/StyledLink";
import { commonDateFormat } from "@/lib/common";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import { modelRevisionRoute } from "@/routes";
import QueryNode, {
  ModelRevisionsListQuery,
} from "@gen/ModelRevisionsListQuery.graphql";

const RevisionsFragment = graphql`
  fragment ModelRevisionsList on Model
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "ModelRevisionsListPaginationQuery") {
    revisions(first: $count, after: $cursor)
      @connection(key: "ModelRevisionsList_revisions") {
      edges {
        node {
          id
          createdAtTimestamp
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const Query = graphql`
  query ModelRevisionsListQuery($input: QueryModelInput!) {
    model(input: $input) {
      __typename
      ... on Model {
        id
        slug
        owner {
          username
        }
        ...FixModelUrlCasing
        ...ModelRevisionsList
      }
    }
  }
`;

export const ModelRevisionsList: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, ModelRevisionsListQuery>;
}> = ({ query }) => {
  const queryRef = useSerializablePreloadedQuery(query);
  const { model: result } = usePreloadedQuery(Query, queryRef);
  const modelRef = extractFromGraphqlErrorUnion(result, "Model");

  const { data: model, loadNext } = usePaginationFragment<
    ModelRevisionsListQuery,
    ModelRevisionsList$key
  >(RevisionsFragment, modelRef);

  return (
    <div>
      <div className="mt-4 mb-2 font-medium">Revision history</div>
      <div className="space-y-2">
        {model.revisions.edges.map((edge) => (
          <div key={edge.node.id}>
            <StyledLink
              href={modelRevisionRoute({
                username: modelRef.owner.username,
                slug: modelRef.slug,
                revisionId: edge.node.id,
              })}
            >
              {format(new Date(edge.node.createdAtTimestamp), commonDateFormat)}
            </StyledLink>
          </div>
        ))}
        {model.revisions.pageInfo.hasNextPage && (
          <Button onClick={() => loadNext(20)}>Load more</Button>
        )}
      </div>
    </div>
  );
};
