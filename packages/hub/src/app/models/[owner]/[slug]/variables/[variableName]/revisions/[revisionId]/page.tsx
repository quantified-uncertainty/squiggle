import { notFound } from "next/navigation";

import { loadVariableRevisionFull } from "@/variables/data/fullVariableRevision";

import { VariableRevisionPage } from "./VariableRevisionPage";

export default async function OuterVariableRevisionPage({
  params,
}: {
  params: Promise<{
    revisionId: string;
    owner: string;
    slug: string;
    variableName: string;
  }>;
}) {
  const { revisionId, owner, slug, variableName } = await params;

  const revision = await loadVariableRevisionFull({
    owner,
    slug,
    variableName,
    revisionId,
  });

  if (!revision) {
    notFound();
  }

  return <VariableRevisionPage revision={revision} />;
}
