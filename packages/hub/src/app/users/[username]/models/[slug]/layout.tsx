"use client";

import { ReactNode, Suspense } from "react";
import Skeleton from "react-loading-skeleton";

import { ModelLayout } from "./ModelLayout";
import { EntityLayout } from "@/components/EntityLayout";
import { modelRoute } from "@/routes";

export default function Layout({
  params,
  children,
}: {
  params: { username: string; slug: string };
  children: ReactNode;
}) {
  const url = modelRoute({ username: params.username, slug: params.slug });

  const fallback = (
    <EntityLayout
      username={params.username}
      slug={params.slug}
      homepageUrl={url}
      isFluid={true}
      headerChildren={
        <Skeleton
          height={32}
          containerClassName="flex-1 max-w-sm flex items-stretch"
          // darker versions of EntityLayout background color
          baseColor="#dadee2"
          highlightColor="#b8bfc7"
        />
      }
    />
  );

  return (
    <Suspense fallback={fallback}>
      <ModelLayout {...params}>{children}</ModelLayout>
    </Suspense>
  );
}
