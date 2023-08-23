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
import { VersionedSquigglePlayground } from "@/squiggle/components/VersionedSquigglePlayground";
import { ModelRevisionViewQuery } from "@gen/ModelRevisionViewQuery.graphql";

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
        <div className="pt-4 pb-8 px-8">
          <div>
            <span className="text-slate-500">Version from</span>{" "}
            {format(model.revision.createdAtTimestamp, commonDateFormat)}.{" "}
            <span className="text-slate-500">Squiggle</span>{" "}
            {model.revision.content.version}.
          </div>
          <StyledLink href={modelUrl}>Go to latest version</StyledLink>
        </div>
      </div>
      <VersionedSquigglePlayground
        defaultCode={model.revision.content.code}
        version={model.revision.content.version}
      />
    </div>
  );
};
