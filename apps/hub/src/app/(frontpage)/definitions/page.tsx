import { RelativeValuesDefinitionList } from "@/relative-values/components/RelativeValuesDefinitionList";
import { loadDefinitionCards } from "@/relative-values/data/cards";

export default async function DefinitionsPage() {
  const page = await loadDefinitionCards();

  return <RelativeValuesDefinitionList page={page} />;
}

export const dynamic = "force-dynamic";
