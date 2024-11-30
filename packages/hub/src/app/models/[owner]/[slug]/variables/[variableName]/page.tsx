import { notFound } from "next/navigation";

import { loadVariableRevisionFull } from "@/variables/data/fullVariableRevision";
import { loadVariableCard } from "@/variables/data/variableCards";

import { VariableRevisionPage } from "./revisions/[revisionId]/VariableRevisionPage";

type Props = {
  params: Promise<{ owner: string; slug: string; variableName: string }>;
};

export default async function OuterVariablePage({ params }: Props) {
  const { owner, slug, variableName } = await params;

  const variable = await loadVariableCard({
    owner,
    slug,
    variableName,
  });

  if (!variable?.currentRevision) {
    // "currentRevision" check won't happen, layout won't render the page if it's null
    notFound();
  }

  const revision = await loadVariableRevisionFull({
    owner,
    slug,
    variableName,
    revisionId: variable.currentRevision.id,
  });

  if (!revision) {
    notFound();
  }

  return (
    <div className="px-8 py-4">
      <VariableRevisionPage revision={revision} />
    </div>
  );
}
