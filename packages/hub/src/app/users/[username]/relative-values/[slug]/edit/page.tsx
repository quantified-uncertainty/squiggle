"use client";

import { useLazyLoadQuery } from "react-relay";

import { RelativeValuesDefinitionPageQuery as RelativeValuesDefinitionPageQueryType } from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import { RelativeValuesDefinitionPageQuery } from "../RelativeValuesDefinitionPage";
import { EditRelativeValuesDefinition } from "./EditRelativeValuesDefinition";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";

export default function Page({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const data = useLazyLoadQuery<RelativeValuesDefinitionPageQueryType>(
    RelativeValuesDefinitionPageQuery,
    {
      input: { ownerUsername: params.username, slug: params.slug },
    }
  );

  return (
    <NarrowPageLayout>
      <EditRelativeValuesDefinition
        definitionRef={data.relativeValuesDefinition}
      />
    </NarrowPageLayout>
  );
}
