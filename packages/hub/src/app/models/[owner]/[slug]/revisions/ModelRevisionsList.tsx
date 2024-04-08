"use client";
import { ModelRevisionsListQuery } from "@gen/ModelRevisionsListQuery.graphql";
import { format } from "date-fns";
import { FC } from "react";
import { useFragment, usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { LoadMore } from "@/components/LoadMore";
import { StyledLink } from "@/components/ui/StyledLink";
import { UsernameLink } from "@/components/UsernameLink";
import { commonDateFormat } from "@/lib/common";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelRevisionRoute } from "@/routes";

import { ModelRevisionsList$key } from "@/__generated__/ModelRevisionsList.graphql";
import { ModelRevisionsList_model$key } from "@/__generated__/ModelRevisionsList_model.graphql";
import { ModelRevisionsList_revision$key } from "@/__generated__/ModelRevisionsList_revision.graphql";

const ModelRevisionItem: FC<{
  modelRef: ModelRevisionsList_model$key;
  revisionRef: ModelRevisionsList_revision$key;
}> = ({ modelRef, revisionRef }) => {
  const revision = useFragment(
    graphql`
      fragment ModelRevisionsList_revision on ModelRevision {
        id
        createdAtTimestamp
        buildStatus
        author {
          username
        }
        comment
        exports {
          id
          variableName
          title
        }
        lastBuild {
          errors
          runtime
        }
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
          slug
        }
      }
    `,
    modelRef
  );

  return (
    <div key={revision.id}>
      <div>
        <StyledLink
          href={modelRevisionRoute({
            owner: model.owner.slug,
            slug: model.slug,
            revisionId: revision.id,
          })}
        >
          {format(new Date(revision.createdAtTimestamp), commonDateFormat)}
        </StyledLink>
        {revision.author ? (
          <>
            {" "}
            by <UsernameLink username={revision.author.username} />
          </>
        ) : null}
      </div>
      {revision.comment ? (
        <div className="text-xs text-slate-700">{revision.comment}</div>
      ) : null}

      <div className="text-xs text-slate-700">{`Build Status: ${revision.buildStatus}`}</div>
      {revision.lastBuild && (
        <div className="text-xs text-slate-700">{`Build Time: ${revision.lastBuild.runtime.toFixed(0)}ms`}</div>
      )}
      {revision.exports.length > 0 ? (
        <div className="text-xs text-green-700">
          {`${revision.exports.length} exports `}
        </div>
      ) : null}
    </div>
  );
};

export const ModelRevisionsList: FC<{
  query: SerializablePreloadedQuery<ModelRevisionsListQuery>;
}> = ({ query }) => {
  const [{ model: result }] = usePageQuery(
    graphql`
      query ModelRevisionsListQuery($input: QueryModelInput!) {
        model(input: $input) {
          __typename
          ... on Model {
            id
            ...ModelRevisionsList_model
            ...ModelRevisionsList
          }
        }
      }
    `,
    query
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
              buildStatus
              exports {
                id
                title
                variableName
              }
              lastBuild {
                errors
                runtime
              }
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
