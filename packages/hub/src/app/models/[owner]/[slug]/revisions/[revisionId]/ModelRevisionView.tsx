"use client";

import { format } from "date-fns";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { StyledLink } from "@/components/ui/StyledLink";
import { commonDateFormat } from "@/lib/common";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelRoute } from "@/routes";
import { ModelRevisionViewQuery } from "@gen/ModelRevisionViewQuery.graphql";
import { VersionedSquigglePlayground } from "@quri/versioned-playground";
import { CommentIcon } from "@quri/ui";

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
          slug
        }
        revision(id: $revisionId) {
          comment
          createdAtTimestamp
          content {
            __typename
            ... on SquiggleSnippet {
              code
              version
            }
          }
        }
      }
    }
  }
`;

export const ModelRevisionView: FC<{
  query: SerializablePreloadedQuery<ModelRevisionViewQuery>;
}> = ({ query }) => {
  const [{ result }] = usePageQuery(Query, query);
  const model = extractFromGraphqlErrorUnion(result, "Model");

  const modelUrl = modelRoute({
    owner: model.owner.slug,
    slug: model.slug,
  });

  const typename = model.revision.content.__typename;
  if (typename !== "SquiggleSnippet") {
    return <div>Unknown model type {typename}</div>;
  }

  return (
    <div>
      <div className="border-b border-gray-300">
        <div className="pt-4 pb-4 px-8 space-y-1">
          <div className="text-sm">
            <span className="text-slate-500">Version from</span>{" "}
            {format(model.revision.createdAtTimestamp, commonDateFormat)}.{" "}
            <span className="text-slate-500">Squiggle</span>{" "}
            {model.revision.content.version}.
          </div>
          <div className="text-sm">
            <StyledLink href={modelUrl}>Go to latest version</StyledLink>
          </div>
          {model.revision.comment ? (
            <div className="flex gap-2 items-center">
              <CommentIcon size={14} className="text-slate-400" />
              <div className="text-sm">{model.revision.comment}</div>
            </div>
          ) : null}
        </div>
      </div>
      <VersionedSquigglePlayground
        defaultCode={model.revision.content.code}
        version={model.revision.content.version}
      />
    </div>
  );
};
