"use client";
import { useFragment, useLazyLoadQuery } from "react-relay";

import { RelativeValuesDefinitionPage$key } from "@/__generated__/RelativeValuesDefinitionPage.graphql";
import { RelativeValuesDefinitionRevision } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { RelativeValuesDefinitionPageQuery as RelativeValuesDefinitionPageQueryType } from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import {
  RelativeValuesDefinitionPageFragment,
  RelativeValuesDefinitionPageQuery,
} from "./RelativeValuesDefinitionPage";

export default function OuterDefinitionPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  // should be de-duped by Next.js caches, so it's not a problem that we do this query twice
  const data = useLazyLoadQuery<RelativeValuesDefinitionPageQueryType>(
    RelativeValuesDefinitionPageQuery,
    {
      input: { ownerUsername: params.username, slug: params.slug },
    },
    { fetchPolicy: "store-and-network" }
  );

  const definition = useFragment<RelativeValuesDefinitionPage$key>(
    RelativeValuesDefinitionPageFragment,
    data.relativeValuesDefinition
  );

  return (
    <RelativeValuesDefinitionRevision dataRef={definition.currentRevision} />
  );
}
