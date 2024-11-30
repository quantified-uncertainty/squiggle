import QueryNode, {
  RelativeValuesDefinitionPageQuery,
} from "@gen/RelativeValuesDefinitionPageQuery.graphql";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { RelativeValuesDefinitionPage } from "./RelativeValuesDefinitionPage";

type Props = {
  params: Promise<{ owner: string; slug: string }>;
};

export default async function OuterDefinitionPage({ params }: Props) {
  const { owner, slug } = await params;
  const query = await loadPageQuery<RelativeValuesDefinitionPageQuery>(
    QueryNode,
    {
      input: { owner, slug },
    }
  );

  return <RelativeValuesDefinitionPage query={query} />;
}
