"use client";
import { useSession } from "next-auth/react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { FC, useEffect } from "react";
import { graphql } from "relay-runtime";

import { useToast } from "@quri/ui";

import { MutationButton } from "@/components/ui/MutationButton";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { groupRoute } from "@/routes";

import { useIsGroupMember } from "../hooks";

import { AcceptGroupInvitePage_ValidateMutation } from "@/__generated__/AcceptGroupInvitePage_ValidateMutation.graphql";
import { AcceptGroupInvitePageMutation } from "@/__generated__/AcceptGroupInvitePageMutation.graphql";
import { AcceptGroupInvitePageQuery } from "@/__generated__/AcceptGroupInvitePageQuery.graphql";

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

  const [validateMutation] = useAsyncMutation<
    AcceptGroupInvitePage_ValidateMutation,
    "ValidateReusableGroupInviteTokenResult"
  >({
    mutation: graphql`
      mutation AcceptGroupInvitePage_ValidateMutation(
        $input: MutationValidateReusableGroupInviteTokenInput!
      ) {
        result: validateReusableGroupInviteToken(input: $input) {
          __typename
          ... on BaseError {
            message
          }
          ... on ValidateReusableGroupInviteTokenResult {
            ok
          }
        }
      }
    `,
    expectedTypename: "ValidateReusableGroupInviteTokenResult",
  });

  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    validateMutation({
      variables: {
        input: {
          groupSlug: group.slug,
          inviteToken,
        },
      },
      onCompleted({ ok }) {
        if (!ok) {
          toast("Invalid token", "error");
          router.replace(groupRoute({ slug: group.slug }));
        }
      },
    });
  }, []);

  return (
    <div>
      <p className="mb-4">{`You've been invited to join ${group.slug} group.`}</p>
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
        onCompleted={() => toast("Joined", "confirmation")}
      />
    </div>
  );
};
