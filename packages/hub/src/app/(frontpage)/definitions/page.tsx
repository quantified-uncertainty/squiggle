import { RelativeValuesDefinitionList } from "@/relative-values/components/RelativeValuesDefinitionList";
import { loadDefinitionCards } from "@/server/relative-values/data";

export default async function DefinitionsPage() {
  const page = await loadDefinitionCards();

  return <RelativeValuesDefinitionList page={page} />;
}
