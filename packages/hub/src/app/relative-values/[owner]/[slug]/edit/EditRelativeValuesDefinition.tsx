"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { useFragment } from "react-relay";

import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { RelativeValuesDefinitionForm } from "@/relative-values/components/RelativeValuesDefinitionForm";
import { FormShape } from "@/relative-values/components/RelativeValuesDefinitionForm/FormShape";
import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { relativeValuesRoute } from "@/routes";
import { updateRelativeValuesDefinitionAction } from "@/server/relative-values/actions/updateRelativeValuesDefinitionAction";

import {
  RelativeValuesDefinitionPageFragment,
  RelativeValuesDefinitionPageQuery,
} from "../RelativeValuesDefinitionPage";

import { RelativeValuesDefinitionPage$key } from "@/__generated__/RelativeValuesDefinitionPage.graphql";
import { RelativeValuesDefinitionPageQuery as QueryType } from "@/__generated__/RelativeValuesDefinitionPageQuery.graphql";
import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";

export const EditRelativeValuesDefinition: FC<{
  query: SerializablePreloadedQuery<QueryType>;
}> = ({ query }) => {
  const [{ relativeValuesDefinition: result }] = usePageQuery(
    RelativeValuesDefinitionPageQuery,
    query
  );

  const definitionRef = extractFromGraphqlErrorUnion(
    result,
    "RelativeValuesDefinition"
  );

  const router = useRouter();

  const definition = useFragment<RelativeValuesDefinitionPage$key>(
    RelativeValuesDefinitionPageFragment,
    definitionRef
  );
  const revision = useFragment<RelativeValuesDefinitionRevision$key>(
    RelativeValuesDefinitionRevisionFragment,
    definition.currentRevision
  );

  const save = async (data: FormShape) => {
    await updateRelativeValuesDefinitionAction({
      slug: definition.slug,
      owner: definition.owner.slug,
      title: data.title,
      items: data.items.map((item) => ({
        ...item,
        clusterId: item.clusterId ?? undefined,
      })),
      clusters: data.clusters.map((cluster) => ({
        ...cluster,
        recommendedUnit: cluster.recommendedUnit || undefined,
      })),
      recommendedUnit: data.recommendedUnit || undefined,
    });
    router.push(
      relativeValuesRoute({
        owner: definition.owner.slug,
        slug: definition.slug,
      })
    );
  };

  return (
    <RelativeValuesDefinitionForm
      defaultValues={{
        slug: "", // unused but necessary for types
        title: revision.title,
        items: revision.items,
        clusters: revision.clusters,
        recommendedUnit: revision.recommendedUnit,
      }}
      withoutSlug
      save={save}
    />
  );
};
