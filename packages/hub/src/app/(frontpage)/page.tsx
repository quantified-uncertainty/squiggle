import { loadPageQuery } from "@/relay/loadPageQuery";

import { FrontPage } from "./FrontPage";

import QueryNode, {
  FrontPageQuery,
} from "@/__generated__/FrontPageQuery.graphql";

export default async function OuterFrontPage() {
  const query = await loadPageQuery<FrontPageQuery>(QueryNode, {});

  return <FrontPage query={query} />;
}
