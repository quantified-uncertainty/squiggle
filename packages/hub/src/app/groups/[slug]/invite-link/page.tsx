import { notFound, redirect } from "next/navigation";

import { WithAuth } from "@/components/WithAuth";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { groupRoute } from "@/routes";
import { loadGroupCard } from "@/server/groups/data/card";
import { hasGroupMembership } from "@/server/groups/data/helpers";

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

  const group = await loadGroupCard(slug);
  if (!group) {
    notFound();
  }
  const isMember = await hasGroupMembership(slug);
  if (isMember) {
    redirect(groupRoute({ slug: group.slug }));
  }

  return <AcceptGroupInvitePage group={group} />;
}

export default async function ({ params }: Props) {
  return (
    <WithAuth>
      <InnerPage params={params} />
    </WithAuth>
  );
}
