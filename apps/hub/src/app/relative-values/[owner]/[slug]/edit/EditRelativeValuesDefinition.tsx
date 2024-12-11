"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { relativeValuesRoute } from "@/lib/routes";
import { updateRelativeValuesDefinitionAction } from "@/relative-values/actions/updateRelativeValuesDefinitionAction";
import { RelativeValuesDefinitionForm } from "@/relative-values/components/RelativeValuesDefinitionForm";
import { RelativeValuesDefinitionFullDTO } from "@/relative-values/data/full";

export const EditRelativeValuesDefinition: FC<{
  definition: RelativeValuesDefinitionFullDTO;
}> = ({ definition }) => {
  const router = useRouter();

  const revision = definition.currentRevision;

  return (
    <RelativeValuesDefinitionForm
      withoutSlug
      defaultValues={{
        slug: "", // unused but necessary for types
        title: revision.title,
        items: revision.items.map((item) => ({
          ...item,
          clusterId: item.clusterId ?? null,
        })),
        clusters: revision.clusters.map((cluster) => ({
          ...cluster,
          recommendedUnit: cluster.recommendedUnit ?? null,
        })),
        recommendedUnit: revision.recommendedUnit ?? null,
      }}
      action={updateRelativeValuesDefinitionAction}
      formDataToInput={(data) => ({
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
      })}
      onSuccess={(data) => {
        router.push(
          relativeValuesRoute({
            owner: data.owner,
            slug: data.slug,
          })
        );
      }}
    />
  );
};
