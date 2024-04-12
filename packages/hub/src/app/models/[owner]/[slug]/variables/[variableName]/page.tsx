import { loadPageQuery } from "@/relay/loadPageQuery";

import { VariablePage } from "./VariablePage";

import QueryNode, {
  VariablePageQuery,
} from "@/__generated__/VariablePageQuery.graphql";

type Props = {
  params: { owner: string; slug: string; variableName: string };
};

export default async function OuterVariablePage({ params }: Props) {
  const query = await loadPageQuery<VariablePageQuery>(QueryNode, {
    input: {
      owner: params.owner,
      slug: params.slug,
      variableName: params.variableName,
    },
  });

  return (
    <div className="py-4 px-8">
      <VariablePage query={query} params={params} />
    </div>
  );
}
