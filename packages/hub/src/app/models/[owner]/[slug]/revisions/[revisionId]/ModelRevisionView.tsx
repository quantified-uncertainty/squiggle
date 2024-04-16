"use client";

import { ModelRevisionViewQuery } from "@gen/ModelRevisionViewQuery.graphql";
import { format } from "date-fns";
import { FC, use } from "react";
import { graphql } from "relay-runtime";

import { CommentIcon } from "@quri/ui";
import {
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { StyledLink } from "@/components/ui/StyledLink";
import { commonDateFormat } from "@/lib/common";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelRoute } from "@/routes";
import { squiggleHubLinker } from "@/squiggle/components/linker";

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
    throw new Error(`Unknown model type ${typename}`);
  }

  const checkedVersion = useAdjustSquiggleVersion(
    model.revision.content.version
  );

  const squiggle = use(versionedSquigglePackages(checkedVersion));

  return (
    <div>
      <div className="border-b border-gray-300">
        <div className="space-y-1 px-8 pb-4 pt-4">
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
            <div className="flex items-center gap-2">
              <CommentIcon size={14} className="text-slate-400" />
              <div className="text-sm">{model.revision.comment}</div>
            </div>
          ) : null}
        </div>
      </div>
      <squiggle.components.SquigglePlayground
        defaultCode={model.revision.content.code}
        linker={squiggleHubLinker}
      />
    </div>
  );
};
