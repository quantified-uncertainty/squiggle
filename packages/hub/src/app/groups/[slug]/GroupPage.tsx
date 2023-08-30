"use client";
import { FC } from "react";
import { usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { DropdownMenu, GroupIcon } from "@quri/ui";

import QueryNode, {
  GroupPageQuery,
} from "@/__generated__/GroupPageQuery.graphql";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { H1, H2 } from "@/components/ui/Headers";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import { GroupMemberList } from "./GroupMemberList";
import { InviteUserToGroupAction } from "./InviteUserToGroupAction";
import { GroupInviteList } from "./GroupInviteList";
import { useIsGroupAdmin } from "./hooks";

const Query = graphql`
  query GroupPageQuery($slug: String!) {
    result: group(slug: $slug) {
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on Group {
        id
        slug
        ...GroupMemberList
        ...GroupInviteList
        ...hooks_useIsGroupAdmin
      }
    }
  }
`;

export const GroupPage: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, GroupPageQuery>;
}> = ({ query }) => {
  const queryRef = useSerializablePreloadedQuery(query);
  const { result } = usePreloadedQuery(Query, queryRef);

  const group = extractFromGraphqlErrorUnion(result, "Group");

  const isAdmin = useIsGroupAdmin(group);

  return (
    <div className="space-y-8">
      <H1 size="large">
        <div className="flex items-center">
          <GroupIcon className="opacity-50 mr-2" />
          {group.slug}
        </div>
      </H1>
      <section>
        <div className="flex justify-between">
          <H2>Members</H2>
          {isAdmin && (
            <DotsDropdown>
              {({ close }) => (
                <DropdownMenu>
                  <InviteUserToGroupAction
                    groupSlug={group.slug}
                    close={close}
                  />
                </DropdownMenu>
              )}
            </DotsDropdown>
          )}
        </div>
        <GroupMemberList groupRef={group} />
      </section>
      <section>
        <H2>Pending invites</H2>
        <GroupInviteList groupRef={group} />
      </section>
    </div>
  );
};
