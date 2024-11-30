import { notFound } from "next/navigation";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadModelCard } from "@/models/data/cards";
import { loadModelRevisions } from "@/models/data/revisions";

import { ModelRevisionsList } from "./ModelRevisionsList";

async function InnerRevisionsPage({
  params,
}: {
  params: Promise<{ owner: string; slug: string }>;
}) {
  const { owner, slug } = await params;
  const page = await loadModelRevisions({ owner, slug });
  const model = await loadModelCard({ owner, slug });
  if (!model) {
    notFound();
  }

  return <ModelRevisionsList page={page} model={model} />;
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ owner: string; slug: string }>;
}) {
  return (
    <NarrowPageLayout>
      <div className="mb-2 mt-4 font-medium">Revision history</div>
      <Suspense fallback={<Skeleton count={10} height={24} />}>
        <InnerRevisionsPage params={params} />
      </Suspense>
    </NarrowPageLayout>
  );
}
