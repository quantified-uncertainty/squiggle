import { loadVariableCards } from "@/server/variables/data";
import { VariableList } from "@/variables/components/VariableList";

export default async function OuterVariablesPage() {
  const variables = await loadVariableCards();

  return <VariableList page={variables} />;
}
