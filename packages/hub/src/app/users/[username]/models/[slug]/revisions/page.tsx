"use client";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { ModelRevisionsList } from "./ModelRevisionsList";

export default function ModelPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  return (
    <NarrowPageLayout>
      <ModelRevisionsList {...params} />
    </NarrowPageLayout>
  );
}
