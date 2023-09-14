import { GroupMemberList$key } from "@/__generated__/GroupMemberList.graphql";
import { GroupMemberListPaginationQuery } from "@/__generated__/GroupMemberListPaginationQuery.graphql";
import { LoadMore } from "@/components/LoadMore";
import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { GroupMemberCard } from "./GroupMemberCard";
import { H2 } from "@/components/ui/Headers";
import { useIsGroupAdmin } from "../hooks";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { DropdownMenu } from "@quri/ui";
import { InviteUserToGroupAction } from "./InviteUserToGroupAction";

const fragment = graphql`
  fragment GroupMemberList on Group
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "GroupMemberListPaginationQuery") {
    ...hooks_useIsGroupAdmin
    ...InviteUserToGroupAction_group
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
                <InviteUserToGroupAction groupRef={group} close={close} />
              </DropdownMenu>
            )}
          </DotsDropdown>
        )}
      </div>
      <div className="space-y-2 mt-2">
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
