"use client";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { RelativeValuesDefinitionPage$key } from "@/__generated__/RelativeValuesDefinitionPage.graphql";
import QueryNode, {
  RelativeValuesDefinitionPageQuery as QueryType,
} from "@/__generated__/RelativeValuesDefinitionPageQuery.graphql";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { RelativeValuesDefinitionRevision } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelForRelativeValuesExportRoute } from "@/routes";
import { LockIcon } from "@quri/ui";
import { RelativeValuesDefinitionPage_export$key } from "@/__generated__/RelativeValuesDefinitionPage_export.graphql";
import { useOwner } from "@/hooks/Owner";

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
      ...RelativeValuesDefinitionPage_export
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

const ExportItem: FC<{
  exportRef: RelativeValuesDefinitionPage_export$key;
}> = ({ exportRef }) => {
  const modelExport = useFragment(
    graphql`
      fragment RelativeValuesDefinitionPage_export on RelativeValuesExport {
        id
        variableName
        modelRevision {
          model {
            slug
            isPrivate
            owner {
              slug
              ...Owner
            }
          }
        }
      }
    `,
    exportRef
  );

  const owner = useOwner(modelExport.modelRevision.model.owner);

  return (
    <div className="flex items-center gap-1">
      <StyledLink
        href={modelForRelativeValuesExportRoute({
          owner,
          slug: modelExport.modelRevision.model.slug,
          variableName: modelExport.variableName,
        })}
      >
        {modelExport.modelRevision.model.owner.slug}/
        {modelExport.modelRevision.model.slug}
      </StyledLink>
      {modelExport.modelRevision.model.isPrivate && (
        <LockIcon size={14} className="text-slate-500" />
      )}
    </div>
  );
};

export const RelativeValuesDefinitionPage: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, QueryType>;
}> = ({ query }) => {
  const [{ relativeValuesDefinition: result }] = usePageQuery(
    query,
    RelativeValuesDefinitionPageQuery
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
                <ExportItem key={row.id} exportRef={row} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <RelativeValuesDefinitionRevision dataRef={definition.currentRevision} />
    </div>
  );
};
