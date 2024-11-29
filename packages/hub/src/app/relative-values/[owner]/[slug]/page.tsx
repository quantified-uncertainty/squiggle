import { notFound } from "next/navigation";

import { loadRelativeValuesExportCardsFromDefinition } from "@/server/relative-values/data/exports";
import { loadRelativeValuesDefinitionFull } from "@/server/relative-values/data/full";

import { RelativeValuesDefinitionPage } from "./RelativeValuesDefinitionPage";

type Props = {
  params: Promise<{ owner: string; slug: string }>;
};

export default async function OuterDefinitionPage({ params }: Props) {
  const { owner, slug } = await params;
  const definition = await loadRelativeValuesDefinitionFull({ owner, slug });

  if (!definition) {
    notFound();
  }

  const modelExports =
    await loadRelativeValuesExportCardsFromDefinition(definition);

  return (
    <RelativeValuesDefinitionPage
      definition={definition}
      modelExports={modelExports}
    />
  );
}
