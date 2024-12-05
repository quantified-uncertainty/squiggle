import { VariableList } from "@/variables/components/VariableList";
import { loadVariableCards } from "@/variables/data/variableCards";

export default async function OuterVariablesPage() {
  const variables = await loadVariableCards();

  return <VariableList page={variables} />;
}
