"use client";
import { FC } from "react";
import { useSubscribeToInvalidationState } from "react-relay";
import { graphql } from "relay-runtime";

import { GroupMembersPageQuery } from "@/__generated__/GroupMembersPageQuery.graphql";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { GroupInviteList } from "./GroupInviteList";
import { GroupMemberList } from "./GroupMemberList";
import { useIsGroupAdmin } from "../hooks";

const Query = graphql`
  query GroupMembersPageQuery($slug: String!) {
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
        ...GroupMemberList
        ...GroupInviteList
        ...hooks_useIsGroupAdmin
      }
    }
  }
`;

export const GroupMembersPage: FC<{
  query: SerializablePreloadedQuery<GroupMembersPageQuery>;
}> = ({ query }) => {
  const [{ result }, { reload }] = usePageQuery(Query, query);

  const group = extractFromGraphqlErrorUnion(result, "Group");

  useSubscribeToInvalidationState([group.id], reload);

  const isAdmin = useIsGroupAdmin(group);

  return (
    <div className="space-y-8">
      <section>
        <GroupMemberList groupRef={group} />
      </section>
      {isAdmin && (
        <section>
          <GroupInviteList groupRef={group} />
        </section>
      )}
    </div>
  );
};
