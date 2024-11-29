import { notFound } from "next/navigation";

import { loadModelCard } from "@/server/models/data/cards";
import { loadModelRevisions } from "@/server/models/data/revisions";

import { ModelRevisionsList } from "./ModelRevisionsList";

export default async function ModelPage({
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
