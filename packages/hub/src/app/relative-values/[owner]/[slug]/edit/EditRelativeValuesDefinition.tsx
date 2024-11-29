"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { RelativeValuesDefinitionForm } from "@/relative-values/components/RelativeValuesDefinitionForm";
import { FormShape } from "@/relative-values/components/RelativeValuesDefinitionForm/FormShape";
import { relativeValuesRoute } from "@/routes";
import { updateRelativeValuesDefinitionAction } from "@/server/relative-values/actions/updateRelativeValuesDefinitionAction";
import { RelativeValuesDefinitionFullDTO } from "@/server/relative-values/data/full";

export const EditRelativeValuesDefinition: FC<{
  definition: RelativeValuesDefinitionFullDTO;
}> = ({ definition }) => {
  const router = useRouter();

  const revision = definition.currentRevision;

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
      withoutSlug
      save={save}
    />
  );
};
