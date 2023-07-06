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

  return (
    <Suspense
      fallback={
        <EntityLayout
          username={params.username}
          slug={params.slug}
          homepageUrl={url}
          isFluid={true}
          headerChildren={
            <Skeleton
              height={32}
              width={320}
              containerClassName="flex items-stretch"
              // darker versions of EntityLayout background color
              baseColor="#dadee2"
              highlightColor="#b8bfc7"
            />
          }
        />
      }
    >
      <ModelLayout {...params}>{children}</ModelLayout>
    </Suspense>
  );
}
