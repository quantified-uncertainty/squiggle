import { loadPageQuery } from "@/relay/loadPageQuery";

import { AcceptGroupInvitePage } from "./AcceptGroupInvitePage";

import QueryNode, {
  AcceptGroupInvitePageQuery,
} from "@/__generated__/AcceptGroupInvitePageQuery.graphql";

type Props = {
  params: { slug: string };
};

export default async function OuterAcceptGroupInvitePage({ params }: Props) {
  const query = await loadPageQuery<AcceptGroupInvitePageQuery>(QueryNode, {
    slug: params.slug,
  });

  return <AcceptGroupInvitePage query={query} />;
}
