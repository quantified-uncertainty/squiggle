"use client";

import { useRouter } from "next/navigation";
import { FC } from "react";

import { H1 } from "@/components/ui/Headers";
import { relativeValuesRoute } from "@/lib/routes";
import { createRelativeValuesDefinitionAction } from "@/relative-values/actions/createRelativeValuesDefinitionAction";
import { RelativeValuesDefinitionForm } from "@/relative-values/components/RelativeValuesDefinitionForm";

export const NewDefinition: FC = () => {
  const router = useRouter();

  return (
    <div>
      <H1 size="normal">New Relative Values definition</H1>
      <RelativeValuesDefinitionForm
        action={createRelativeValuesDefinitionAction}
        formDataToInput={(data) => ({
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
    </div>
  );
};
