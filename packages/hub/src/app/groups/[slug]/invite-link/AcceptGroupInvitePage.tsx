"use client";
import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { AcceptGroupInvitePageMutation } from "@/__generated__/AcceptGroupInvitePageMutation.graphql";
import { MutationButton } from "@/components/ui/MutationButton";
import { usePageQuery } from "@/relay/usePageQuery";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { AcceptGroupInvitePageQuery } from "@/__generated__/AcceptGroupInvitePageQuery.graphql";
import { useIsGroupMember } from "../hooks";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { groupRoute } from "@/routes";

export const AcceptGroupInvitePage: FC<{
  query: SerializablePreloadedQuery<AcceptGroupInvitePageQuery>;
}> = ({ query }) => {
  useSession({ required: true });

  const [{ result }] = usePageQuery(
    graphql`
      query AcceptGroupInvitePageQuery($slug: String!) {
        result: group(slug: $slug) {
          __typename
          ... on Group {
            slug
            ...hooks_useIsGroupMember
          }
        }
      }
    `,
    query
  );
  const group = extractFromGraphqlErrorUnion(result, "Group");
  const isGroupMember = useIsGroupMember(group);

  if (isGroupMember) {
    redirect(groupRoute({ slug: group.slug }));
  }

  const params = useSearchParams();
  const inviteToken = params.get("token");
  if (!inviteToken) {
    throw new Error("Token is missing");
  }

  return (
    <div>
      <MutationButton<
        AcceptGroupInvitePageMutation,
        "AcceptReusableGroupInviteTokenResult"
      >
        mutation={graphql`
          mutation AcceptGroupInvitePageMutation(
            $input: MutationAcceptReusableGroupInviteTokenInput!
          ) {
            result: acceptReusableGroupInviteToken(input: $input) {
              __typename
              ... on BaseError {
                message
              }
              ... on AcceptReusableGroupInviteTokenResult {
                __typename
                membership {
                  group {
                    id
                    slug
                    ...hooks_useIsGroupMember
                  }
                }
              }
            }
          }
        `}
        expectedTypename="AcceptReusableGroupInviteTokenResult"
        variables={{
          input: {
            groupSlug: group.slug,
            inviteToken,
          },
        }}
        title="Join this group"
        theme="primary"
      />
    </div>
  );
};
