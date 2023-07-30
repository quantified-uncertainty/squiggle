import QueryNode, {
  FrontPageQuery,
} from "@/__generated__/FrontPageQuery.graphql";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import { FrontPage } from "./FrontPage";

export default async function OuterFrontPage() {
  const query = await loadSerializableQuery<typeof QueryNode, FrontPageQuery>(
    QueryNode.params,
    {}
  );

  return (
    <NarrowPageLayout>
      <FrontPage query={query} />
    </NarrowPageLayout>
  );
}
