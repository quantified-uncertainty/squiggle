import { loadPageQuery } from "@/relay/loadPageQuery";
import QueryNode, {
  RelativeValuesDefinitionPageQuery,
} from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import { RelativeValuesDefinitionPage } from "./RelativeValuesDefinitionPage";

type Props = {
  params: { owner: string; slug: string };
};

export default async function OuterDefinitionPage({ params }: Props) {
  const query = await loadPageQuery<RelativeValuesDefinitionPageQuery>(
    QueryNode,
    {
      input: { owner: params.owner, slug: params.slug },
    }
  );

  return <RelativeValuesDefinitionPage query={query} />;
}
