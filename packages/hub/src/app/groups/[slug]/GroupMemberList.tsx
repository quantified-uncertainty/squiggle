import { GroupMemberList$key } from "@/__generated__/GroupMemberList.graphql";
import { GroupMemberListPaginationQuery } from "@/__generated__/GroupMemberListPaginationQuery.graphql";
import { LoadMore } from "@/components/LoadMore";
import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { GroupMemberCard } from "./GroupMemberCard";

const fragment = graphql`
  fragment GroupMemberList on Group
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "GroupMemberListPaginationQuery") {
    ...hooks_useIsGroupAdmin
    memberships(first: $count, after: $cursor)
      @connection(key: "GroupMemberList_memberships") {
      edges {
        node {
          id
          ...GroupMemberCard
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

type Props = {
  groupRef: GroupMemberList$key;
};

export const GroupMemberList: FC<Props> = ({ groupRef }) => {
  const { data: group, loadNext } = usePaginationFragment<
    GroupMemberListPaginationQuery,
    GroupMemberList$key
  >(fragment, groupRef);

  return (
    <div>
      <div className="space-y-2">
        {group.memberships.edges.map(({ node: membership }) => (
          <GroupMemberCard
            groupRef={group}
            membershipRef={membership}
            key={membership.id}
          />
        ))}
      </div>
      {group.memberships.pageInfo.hasNextPage && (
        <LoadMore loadNext={loadNext} />
      )}
    </div>
  );
};
