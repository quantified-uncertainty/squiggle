import { loadPageQuery } from "@/relay/loadPageQuery";

import { VariablesPage } from "./VariablesPage";

import QueryNode, {
  VariablesPageQuery,
} from "@/__generated__/VariablesPageQuery.graphql";

export default async function OuterVariablesPage() {
  const query = await loadPageQuery<VariablesPageQuery>(QueryNode, {});

  return <VariablesPage query={query} />;
}
