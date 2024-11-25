import { loadPageQuery } from "@/relay/loadPageQuery";

import { VariablePage } from "./VariablePage";

import QueryNode, {
  VariablePageQuery,
} from "@/__generated__/VariablePageQuery.graphql";

type Props = {
  params: Promise<{ owner: string; slug: string; variableName: string }>;
};

export default async function OuterVariablePage({ params }: Props) {
  const { owner, slug, variableName } = await params;
  const query = await loadPageQuery<VariablePageQuery>(QueryNode, {
    input: {
      owner,
      slug,
      variableName,
    },
  });

  return (
    <div className="px-8 py-4">
      <VariablePage query={query} params={await params} />
    </div>
  );
}
