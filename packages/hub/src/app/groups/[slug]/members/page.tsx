import {
  loadGroupMembers,
  loadMyMembership,
  loadReusableInviteToken,
} from "@/server/groups/data/members";

import { GroupMemberList } from "./GroupMemberList";
import { GroupReusableInviteSection } from "./GroupReusableInviteSection";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OuterGroupMembersPage({ params }: Props) {
  const { slug } = await params;
  const members = await loadGroupMembers({ groupSlug: slug });

  const myMembership = await loadMyMembership({ groupSlug: slug });
  const isAdmin = myMembership?.role === "Admin";

  return (
    <div className="space-y-8">
      <section>
        <GroupMemberList groupSlug={slug} page={members} isAdmin={isAdmin} />
      </section>
      {isAdmin && (
        <section>
          <GroupReusableInviteSection
            groupSlug={slug}
            reusableInviteToken={await loadReusableInviteToken({
              groupSlug: slug,
            })}
          />
        </section>
      )}
    </div>
  );
}
