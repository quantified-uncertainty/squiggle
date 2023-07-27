"use client";

import { useLazyLoadQuery } from "react-relay";

import { RelativeValuesDefinitionPageQuery as RelativeValuesDefinitionPageQueryType } from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import { RelativeValuesDefinitionPageQuery } from "../RelativeValuesDefinitionPage";
import { EditRelativeValuesDefinition } from "./EditRelativeValuesDefinition";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";

export default function Page({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const { relativeValuesDefinition: result } =
    useLazyLoadQuery<RelativeValuesDefinitionPageQueryType>(
      RelativeValuesDefinitionPageQuery,
      {
        input: { ownerUsername: params.username, slug: params.slug },
      }
    );

  const definitionRef = extractFromGraphqlErrorUnion(
    result,
    "RelativeValuesDefinition"
  );

  return (
    <NarrowPageLayout>
      <EditRelativeValuesDefinition definitionRef={definitionRef} />
    </NarrowPageLayout>
  );
}
