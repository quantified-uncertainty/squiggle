"use client";
import { format } from "date-fns";
import { FC } from "react";
import { useFragment, usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelRevisionsList$key } from "@/__generated__/ModelRevisionsList.graphql";
import { LoadMore } from "@/components/LoadMore";
import { StyledLink } from "@/components/ui/StyledLink";
import { commonDateFormat } from "@/lib/common";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelRevisionRoute } from "@/routes";
import QueryNode, {
  ModelRevisionsListQuery,
} from "@gen/ModelRevisionsListQuery.graphql";
import { ModelRevisionsList_model$key } from "@/__generated__/ModelRevisionsList_model.graphql";
import { ModelRevisionsList_revision$key } from "@/__generated__/ModelRevisionsList_revision.graphql";
import { useOwner } from "@/hooks/Owner";

const ModelRevisionItem: FC<{
  modelRef: ModelRevisionsList_model$key;
  revisionRef: ModelRevisionsList_revision$key;
}> = ({ modelRef, revisionRef }) => {
  const revision = useFragment(
    graphql`
      fragment ModelRevisionsList_revision on ModelRevision {
        id
        createdAtTimestamp
      }
    `,
    revisionRef
  );

  const model = useFragment(
    graphql`
      fragment ModelRevisionsList_model on Model {
        id
        slug
        owner {
          ...Owner
        }
      }
    `,
    modelRef
  );

  const owner = useOwner(model.owner);

  return (
    <div key={revision.id}>
      <StyledLink
        href={modelRevisionRoute({
          owner,
          slug: model.slug,
          revisionId: revision.id,
        })}
      >
        {format(new Date(revision.createdAtTimestamp), commonDateFormat)}
      </StyledLink>
    </div>
  );
};

export const ModelRevisionsList: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, ModelRevisionsListQuery>;
}> = ({ query }) => {
  const [{ model: result }] = usePageQuery(
    query,
    graphql`
      query ModelRevisionsListQuery($input: QueryModelInput!) {
        model(input: $input) {
          __typename
          ... on Model {
            id
            ...ModelRevisionsList_model
            ...FixModelUrlCasing
            ...ModelRevisionsList
          }
        }
      }
    `
  );

  const modelRef = extractFromGraphqlErrorUnion(result, "Model");

  const {
    data: { revisions },
    loadNext,
  } = usePaginationFragment<ModelRevisionsListQuery, ModelRevisionsList$key>(
    graphql`
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
              ...ModelRevisionsList_revision
              id
              createdAtTimestamp
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `,
    modelRef
  );

  return (
    <div>
      <div className="mt-4 mb-2 font-medium">Revision history</div>
      <div className="space-y-2">
        {revisions.edges.map((edge) => (
          <ModelRevisionItem
            key={edge.node.id}
            revisionRef={edge.node}
            modelRef={modelRef}
          />
        ))}
      </div>
      {revisions.pageInfo.hasNextPage && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
