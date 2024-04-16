import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { DropdownMenu } from "@quri/ui";

import { LoadMore } from "@/components/LoadMore";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { H2 } from "@/components/ui/Headers";

import { useIsGroupAdmin } from "../hooks";
import { AddUserToGroupAction } from "./AddUserToGroupAction";
import { GroupMemberCard } from "./GroupMemberCard";

import { GroupMemberList$key } from "@/__generated__/GroupMemberList.graphql";
import { GroupMemberListPaginationQuery } from "@/__generated__/GroupMemberListPaginationQuery.graphql";

const fragment = graphql`
  fragment GroupMemberList on Group
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "GroupMemberListPaginationQuery") {
    ...hooks_useIsGroupAdmin
    ...AddUserToGroupAction_group
    ...GroupMemberCard_group

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

  const isAdmin = useIsGroupAdmin(group);

  return (
    <div>
      <div className="flex items-center justify-between">
        <H2>Members</H2>
        {isAdmin && (
          <DotsDropdown>
            {({ close }) => (
              <DropdownMenu>
                <AddUserToGroupAction groupRef={group} close={close} />
              </DropdownMenu>
            )}
          </DotsDropdown>
        )}
      </div>
      <div className="mt-2 space-y-2">
        {group.memberships.edges.map(({ node: membership }) => (
          <GroupMemberCard
            key={membership.id}
            groupRef={group}
            membershipRef={membership}
          />
        ))}
      </div>
      {group.memberships.pageInfo.hasNextPage && (
        <LoadMore loadNext={loadNext} />
      )}
    </div>
  );
};
