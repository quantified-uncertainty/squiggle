import { loadPageQuery } from "@/relay/loadPageQuery";

import { DefinitionsPage } from "./DefinitionsPage";

import QueryNode, {
  DefinitionsPageQuery,
} from "@/__generated__/DefinitionsPageQuery.graphql";

export default async function OuterDefinitionsPage() {
  const query = await loadPageQuery<DefinitionsPageQuery>(QueryNode, {});

  return <DefinitionsPage query={query} />;
}
