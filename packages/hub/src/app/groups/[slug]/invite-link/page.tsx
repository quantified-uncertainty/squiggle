import { WithAuth } from "@/components/WithAuth";
import { loadPageQuery } from "@/relay/loadPageQuery";

import { AcceptGroupInvitePage } from "./AcceptGroupInvitePage";

import QueryNode, {
  AcceptGroupInvitePageQuery,
} from "@/__generated__/AcceptGroupInvitePageQuery.graphql";

type Props = {
  params: Promise<{ slug: string }>;
};

async function InnerPage({ params }: Props) {
  const { slug } = await params;
  const query = await loadPageQuery<AcceptGroupInvitePageQuery>(QueryNode, {
    slug,
  });

  return <AcceptGroupInvitePage query={query} />;
}

export default async function ({ params }: Props) {
  return (
    <WithAuth>
      <InnerPage params={params} />
    </WithAuth>
  );
}
