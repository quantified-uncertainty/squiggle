import { loadPageQuery } from "@/relay/loadPageQuery";

import { AcceptGroupInvitePage } from "./AcceptGroupInvitePage";

import QueryNode, {
  AcceptGroupInvitePageQuery,
} from "@/__generated__/AcceptGroupInvitePageQuery.graphql";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OuterAcceptGroupInvitePage({ params }: Props) {
  const { slug } = await params;
  const query = await loadPageQuery<AcceptGroupInvitePageQuery>(QueryNode, {
    slug,
  });

  return <AcceptGroupInvitePage query={query} />;
}
