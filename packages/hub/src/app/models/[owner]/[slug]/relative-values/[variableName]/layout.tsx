import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

import { LinkIcon, ScaleIcon } from "@quri/ui";

import { StyledLink } from "@/components/ui/StyledLink";
import { relativeValuesRoute } from "@/routes";
import { loadModelCard } from "@/server/models/data/cards";
import { isModelEditable } from "@/server/models/data/helpers";
import { loadRelativeValuesDefinitionFull } from "@/server/relative-values/data/full";
import { loadRelativeValuesExportFullFromModelRevision } from "@/server/relative-values/data/fullExport";

import { CacheMenu } from "./CacheMenu";
import { RelativeValuesModelLayout } from "./RelativeValuesModelLayout";
import { RelativeValuesTabs } from "./Tabs";

export default async function Layout({
  params,
  children,
}: PropsWithChildren<{
  params: Promise<{ owner: string; slug: string; variableName: string }>;
}>) {
  const { owner, slug, variableName } = await params;

  // sleep
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const model = await loadModelCard({ owner, slug });
  if (!model) {
    notFound();
  }

  const isEditable = await isModelEditable(model);

  const revision = model.currentRevision;

  const relativeValuesExport =
    await loadRelativeValuesExportFullFromModelRevision({
      modelRevisionId: revision.id,
      variableName,
    });

  if (!relativeValuesExport) {
    notFound();
  }

  const definition = await loadRelativeValuesDefinitionFull({
    owner: relativeValuesExport.definition.owner,
    slug: relativeValuesExport.definition.slug,
  });

  if (!definition) {
    notFound();
  }

  const content = revision.squiggleSnippet;
  if (!content) {
    throw new Error("No SquiggleSnippet content");
  }

  const definitionLink = (
    <StyledLink
      className="flex items-center text-sm"
      href={relativeValuesRoute({
        owner: definition.owner.slug,
        slug: definition.slug,
      })}
    >
      <LinkIcon className="mr-1 opacity-50" size={18} />
      <span className="font-mono">{`${definition.owner.slug}/${definition.slug}`}</span>
    </StyledLink>
  );

  return (
    <div className="px-8 py-4">
      <div className="mb-6 flex justify-between px-2 py-2">
        <div className="flex items-center">
          <ScaleIcon className="mr-2 text-gray-700 opacity-40" size={22} />
          <div className="flex font-mono font-bold text-gray-700">
            {variableName}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {definitionLink}
          <CacheMenu
            relativeValuesExport={relativeValuesExport}
            definitionRevision={definition.currentRevision}
            isEditable={isEditable}
          />
          <RelativeValuesTabs model={model} variableName={variableName} />
        </div>
      </div>
      <RelativeValuesModelLayout
        code={content.code}
        variableName={variableName}
        cache={relativeValuesExport.cache}
        definitionRevision={definition.currentRevision}
      >
        {children}
      </RelativeValuesModelLayout>
    </div>
  );
}
