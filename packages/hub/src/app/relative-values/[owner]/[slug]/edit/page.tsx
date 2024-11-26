import QueryNode, {
  RelativeValuesDefinitionPageQuery,
} from "@gen/RelativeValuesDefinitionPageQuery.graphql";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { WithAuth } from "@/components/WithAuth";
import { loadPageQuery } from "@/relay/loadPageQuery";

import { EditRelativeValuesDefinition } from "./EditRelativeValuesDefinition";

type Props = {
  params: Promise<{ owner: string; slug: string }>;
};

async function InnerPage({ params }: Props) {
  const { owner, slug } = await params;
  const query = await loadPageQuery<RelativeValuesDefinitionPageQuery>(
    QueryNode,
    {
      input: { owner, slug },
    }
  );

  return (
    <NarrowPageLayout>
      <EditRelativeValuesDefinition query={query} />
    </NarrowPageLayout>
  );
}

export default async function Page({ params }: Props) {
  return (
    <WithAuth>
      <InnerPage params={params} />
    </WithAuth>
  );
}
