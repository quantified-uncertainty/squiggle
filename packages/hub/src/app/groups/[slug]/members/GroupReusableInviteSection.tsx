"use client";
import { FC, useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { ClipboardCopyIcon, TextTooltip, useToast } from "@quri/ui";

import { H2 } from "@/components/ui/Headers";
import { ServerActionButton } from "@/components/ui/ServerActionButton";
import { groupInviteLink } from "@/routes";
import { createReusableGroupInviteTokenAction } from "@/server/groups/actions/createReusableGroupInviteTokenAction";
import { deleteReusableGroupInviteTokenAction } from "@/server/groups/actions/deleteReusableGroupInviteTokenAction";

type Props = {
  groupSlug: string;
  reusableInviteToken: string | null;
};

export const GroupReusableInviteSection: FC<Props> = ({
  groupSlug,
  reusableInviteToken,
}) => {
  const toast = useToast();

  // Necessary for SSR and to avoid hydration errors
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const inviteLink = useMemo(() => {
    if (!reusableInviteToken) {
      return undefined;
    }
    const routeArgs = {
      groupSlug: groupSlug,
      inviteToken: reusableInviteToken,
    };
    const fullLink = groupInviteLink(routeArgs);
    const blurredLink = groupInviteLink({ ...routeArgs, blur: true });

    return {
      full: `${origin}${fullLink}`,
      blurred: `${origin}${blurredLink}`,
    };
  }, [reusableInviteToken, groupSlug, origin]);

  const copy = () => {
    if (!inviteLink) {
      return;
    }
    navigator.clipboard.writeText(inviteLink.full);
    toast("Copied to clipboard", "confirmation");
  };

  return (
    <div>
      <H2>Invite link</H2>
      {inviteLink ? (
        origin ? (
          <TextTooltip text="Click to copy">
            <div
              onClick={copy}
              className="group flex cursor-pointer items-center gap-1 rounded bg-white p-2 shadow hover:bg-slate-200"
            >
              <ClipboardCopyIcon
                size={24}
                className="text-slate-400 group-hover:text-slate-500"
              />
              <code className="text-xs">{inviteLink.blurred}</code>
            </div>
          </TextTooltip>
        ) : (
          <Skeleton height={36} />
        )
      ) : null}
      <div className="mt-4 flex gap-2">
        <ServerActionButton
          action={() =>
            createReusableGroupInviteTokenAction({ slug: groupSlug })
          }
          title={
            reusableInviteToken ? "Reset Invite Link" : "Create Invite Link"
          }
        />
        {reusableInviteToken ? (
          <ServerActionButton
            action={() =>
              deleteReusableGroupInviteTokenAction({ slug: groupSlug })
            }
            title="Delete Invite Link"
          />
        ) : null}
      </div>
    </div>
  );
};
