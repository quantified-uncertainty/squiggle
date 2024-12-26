"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { useToast } from "@quri/ui";

import { SafeActionButton } from "@/components/ui/SafeActionButton";
import { acceptReusableGroupInviteTokenAction } from "@/groups/actions/acceptReusableGroupInviteTokenAction";
import { GroupCardDTO } from "@/groups/data/groupCards";
import { groupRoute } from "@/lib/routes";

export const AcceptGroupInvitePage: FC<{
  group: GroupCardDTO;
  inviteToken: string;
}> = ({ group, inviteToken }) => {
  const toast = useToast();
  const router = useRouter();

  return (
    <div>
      <p className="mb-4">{`You've been invited to join ${group.slug} group.`}</p>
      <SafeActionButton
        theme="primary"
        action={acceptReusableGroupInviteTokenAction}
        onSuccess={() => {
          toast("Joined", "confirmation");
          router.push(groupRoute({ slug: group.slug }));
        }}
        input={{
          groupSlug: group.slug,
          inviteToken,
        }}
      >
        Join this group
      </SafeActionButton>
    </div>
  );
};
