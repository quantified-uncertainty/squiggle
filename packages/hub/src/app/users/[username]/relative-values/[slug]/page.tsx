"use client";
import { useFragment, useLazyLoadQuery } from "react-relay";

import { RelativeValuesDefinitionPage$key } from "@/__generated__/RelativeValuesDefinitionPage.graphql";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { RelativeValuesDefinitionRevision } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { modelForRelativeValuesExportRoute } from "@/routes";
import { RelativeValuesDefinitionPageQuery as RelativeValuesDefinitionPageQueryType } from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import {
  RelativeValuesDefinitionPageFragment,
  RelativeValuesDefinitionPageQuery,
} from "./RelativeValuesDefinitionPage";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";

export default function OuterDefinitionPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  // should be de-duped by Next.js caches, so it's not a problem that we do this query twice
  const { relativeValuesDefinition: result } =
    useLazyLoadQuery<RelativeValuesDefinitionPageQueryType>(
      RelativeValuesDefinitionPageQuery,
      {
        input: { ownerUsername: params.username, slug: params.slug },
      },
      { fetchPolicy: "store-and-network" }
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
                <div key={row.id}>
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
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <RelativeValuesDefinitionRevision dataRef={definition.currentRevision} />
    </div>
  );
}
