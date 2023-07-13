"use client";

import { ReactNode, Suspense } from "react";

import { EntityLayout } from "@/components/EntityLayout";
import { useParams } from "next/navigation";
import { ModelLayout, entityNodes } from "./ModelLayout";

export default function Layout({
  params,
  children,
}: {
  params: { username: string; slug: string };
  children: ReactNode;
}) {
  const { variableName } = useParams();
  const fallback = (
    <EntityLayout
      nodes={entityNodes(params.username, params.slug, variableName)}
      isFluid={true}
      headerChildren={
        <div
          style={{
            height: 49, // matches the height of real header content
          }}
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
