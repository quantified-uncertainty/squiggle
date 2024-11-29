"use client";

import { useRouter } from "next/navigation";
import { FC } from "react";

import { H1 } from "@/components/ui/Headers";
import { RelativeValuesDefinitionForm } from "@/relative-values/components/RelativeValuesDefinitionForm";
import { FormShape } from "@/relative-values/components/RelativeValuesDefinitionForm/FormShape";
import { relativeValuesRoute } from "@/routes";
import { createRelativeValuesDefinitionAction } from "@/server/relative-values/actions/createRelativeValuesDefinitionAction";

export const NewDefinition: FC = () => {
  const router = useRouter();

  const save = async (data: FormShape) => {
    const result = await createRelativeValuesDefinitionAction({
      slug: data.slug,
      title: data.title,
      items: data.items.map((item) => ({
        ...item,
        clusterId: item.clusterId ?? undefined,
      })),
      clusters: data.clusters.map((cluster) => ({
        ...cluster,
        recommendedUnit: cluster.recommendedUnit ?? undefined,
      })),
      recommendedUnit: data.recommendedUnit ?? undefined,
    });
    router.push(
      relativeValuesRoute({
        owner: result.owner,
        slug: result.slug,
      })
    );
    // confirmation: "Definition created",
  };

  return (
    <div>
      <H1 size="normal">New Relative Values definition</H1>
      <RelativeValuesDefinitionForm save={save} />
    </div>
  );
};
