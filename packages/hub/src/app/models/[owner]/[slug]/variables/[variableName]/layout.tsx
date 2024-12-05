import { PropsWithChildren } from "react";

import { loadVariableRevisions } from "@/variables/data/variableRevisions";

import { VariableRevisionsPanel } from "./VariableRevisionsPanel";

type Props = {
  params: Promise<{ owner: string; slug: string; variableName: string }>;
};

export default async function VariableLayout({
  children,
  params,
}: PropsWithChildren<Props>) {
  const { owner, slug, variableName } = await params;
  const revisions = await loadVariableRevisions({ owner, slug, variableName });

  if (!revisions.items.length) {
    return <div>No revisions found. They should be built shortly.</div>;
  }

  return (
    <div className="flex">
      <div className="w-full flex-1">{children}</div>
      <VariableRevisionsPanel
        page={revisions}
        owner={owner}
        modelSlug={slug}
        variableName={variableName}
      />
    </div>
  );
}
