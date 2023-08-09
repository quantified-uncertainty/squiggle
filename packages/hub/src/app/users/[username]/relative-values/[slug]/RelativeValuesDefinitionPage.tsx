"use client";
import { FC } from "react";
import { useFragment, usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { RelativeValuesDefinitionPage$key } from "@/__generated__/RelativeValuesDefinitionPage.graphql";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { RelativeValuesDefinitionRevision } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import { modelForRelativeValuesExportRoute } from "@/routes";
import QueryNode, {
  RelativeValuesDefinitionPageQuery as QueryType,
} from "@/__generated__/RelativeValuesDefinitionPageQuery.graphql";
import { LockIcon } from "@quri/ui";

export const RelativeValuesDefinitionPageFragment = graphql`
  fragment RelativeValuesDefinitionPage on RelativeValuesDefinition {
    id
    slug
    owner {
      username
    }
    currentRevision {
      ...RelativeValuesDefinitionRevision
    }
    modelExports {
      id
      variableName
      modelRevision {
        model {
          owner {
            username
          }
          slug
          isPrivate
        }
      }
    }
  }
`;

// Shared in this route and in /edit
export const RelativeValuesDefinitionPageQuery = graphql`
  query RelativeValuesDefinitionPageQuery(
    $input: QueryRelativeValuesDefinitionInput!
  ) {
    relativeValuesDefinition(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on RelativeValuesDefinition {
        ...RelativeValuesDefinitionPage
      }
    }
  }
`;

export const RelativeValuesDefinitionPage: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, QueryType>;
}> = ({ query }) => {
  const queryRef = useSerializablePreloadedQuery(query);
  const { relativeValuesDefinition: result } = usePreloadedQuery(
    RelativeValuesDefinitionPageQuery,
    queryRef
  );

  const definitionRef = extractFromGraphqlErrorUnion(
    result,
    "RelativeValuesDefinition"
  );

  const definition = useFragment<RelativeValuesDefinitionPage$key>(
    RelativeValuesDefinitionPageFragment,
    definitionRef
  );

  return (
    <div className="mt-4">
      <div>
        {definition.modelExports.length ? (
          <section className="mb-4">
            <H2>Implemented by:</H2>
            <div className="flex flex-col">
              {definition.modelExports.map((row) => (
                <div key={row.id} className="flex items-center gap-1">
                  <StyledLink
                    href={modelForRelativeValuesExportRoute({
                      username: row.modelRevision.model.owner.username,
                      slug: row.modelRevision.model.slug,
                      variableName: row.variableName,
                    })}
                  >
                    {row.modelRevision.model.owner.username}/
                    {row.modelRevision.model.slug}
                  </StyledLink>
                  {row.modelRevision.model.isPrivate && (
                    <LockIcon size={14} className="text-slate-500" />
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <RelativeValuesDefinitionRevision dataRef={definition.currentRevision} />
    </div>
  );
};
