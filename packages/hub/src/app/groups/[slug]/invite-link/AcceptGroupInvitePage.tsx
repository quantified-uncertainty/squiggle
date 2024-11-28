"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { useToast } from "@quri/ui";

import { ServerActionButton } from "@/components/ui/ServerActionButton";
import { groupRoute } from "@/routes";
import { acceptReusableGroupInviteTokenAction } from "@/server/groups/actions/acceptReusableGroupInviteTokenAction";
import { GroupCardDTO } from "@/server/groups/data/card";

export const AcceptGroupInvitePage: FC<{
  group: GroupCardDTO;
  inviteToken: string;
}> = ({ group, inviteToken }) => {
  const toast = useToast();
  const router = useRouter();

  return (
    <div>
      <p className="mb-4">{`You've been invited to join ${group.slug} group.`}</p>
      <ServerActionButton
        title="Join this group"
        theme="primary"
        action={async () => {
          await acceptReusableGroupInviteTokenAction({
            groupSlug: group.slug,
            inviteToken,
          });
          toast("Joined", "confirmation");
          router.push(groupRoute({ slug: group.slug }));
        }}
      />
    </div>
  );
};
