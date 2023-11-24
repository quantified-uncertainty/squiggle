import { FC, useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { ClipboardCopyIcon, TextTooltip, useToast } from "@quri/ui";

import { GroupReusableInviteSection$key } from "@/__generated__/GroupReusableInviteSection.graphql";
import { GroupReusableInviteSection_CreateMutation } from "@/__generated__/GroupReusableInviteSection_CreateMutation.graphql";
import { GroupReusableInviteSection_DeleteMutation } from "@/__generated__/GroupReusableInviteSection_DeleteMutation.graphql";
import { H2 } from "@/components/ui/Headers";
import { MutationButton } from "@/components/ui/MutationButton";
import { groupInviteLink } from "@/routes";

type Props = {
  groupRef: GroupReusableInviteSection$key;
};

export const GroupReusableInviteSection: FC<Props> = ({ groupRef }) => {
  const group = useFragment(
    graphql`
      fragment GroupReusableInviteSection on Group {
        id
        slug
        reusableInviteToken
      }
    `,
    groupRef
  );

  const toast = useToast();

  // Necessary for SSR and to avoid hydration errors
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const inviteLink = useMemo(() => {
    if (!group.reusableInviteToken) {
      return undefined;
    }
    const routeArgs = {
      groupSlug: group.slug,
      inviteToken: group.reusableInviteToken,
    };
    const fullLink = groupInviteLink(routeArgs);
    const blurredLink = groupInviteLink({ ...routeArgs, blur: true });

    return {
      full: `${origin}${fullLink}`,
      blurred: `${origin}${blurredLink}`,
    };
  }, [group.reusableInviteToken, group.slug, origin]);

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
              className="group flex items-center gap-1 rounded shadow bg-white p-2 cursor-pointer hover:bg-slate-200"
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
      <div className="flex gap-2 mt-4">
        <MutationButton<
          GroupReusableInviteSection_CreateMutation,
          "CreateReusableGroupInviteTokenResult"
        >
          mutation={graphql`
            mutation GroupReusableInviteSection_CreateMutation(
              $input: MutationCreateReusableGroupInviteTokenInput!
            ) {
              result: createReusableGroupInviteToken(input: $input) {
                __typename
                ... on BaseError {
                  message
                }
                ... on CreateReusableGroupInviteTokenResult {
                  group {
                    reusableInviteToken
                  }
                }
              }
            }
          `}
          expectedTypename="CreateReusableGroupInviteTokenResult"
          variables={{
            input: { slug: group.slug },
          }}
          title={
            group.reusableInviteToken
              ? "Reset Invite Link"
              : "Create Invite Link"
          }
        />
        {group.reusableInviteToken ? (
          <MutationButton<
            GroupReusableInviteSection_DeleteMutation,
            "DeleteReusableGroupInviteTokenResult"
          >
            mutation={graphql`
              mutation GroupReusableInviteSection_DeleteMutation(
                $input: MutationDeleteReusableGroupInviteTokenInput!
              ) {
                result: deleteReusableGroupInviteToken(input: $input) {
                  __typename
                  ... on BaseError {
                    message
                  }
                  ... on DeleteReusableGroupInviteTokenResult {
                    group {
                      reusableInviteToken
                    }
                  }
                }
              }
            `}
            expectedTypename="DeleteReusableGroupInviteTokenResult"
            variables={{
              input: { slug: group.slug },
            }}
            title="Delete Invite Link"
          />
        ) : null}
      </div>
    </div>
  );
};
