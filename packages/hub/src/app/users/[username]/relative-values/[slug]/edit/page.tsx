"use client";

import { useLazyLoadQuery } from "react-relay";

import { RelativeValuesDefinitionPageQuery as RelativeValuesDefinitionPageQueryType } from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import { RelativeValuesDefinitionPageQuery } from "../RelativeValuesDefinitionPage";
import { EditRelativeValuesDefinition } from "./EditRelativeValuesDefinition";

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
    <div className="mx-auto max-w-6xl">
      <EditRelativeValuesDefinition
        definitionRef={data.relativeValuesDefinition}
      />
    </div>
  );
}
