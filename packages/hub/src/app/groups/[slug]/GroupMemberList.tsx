import { GroupMemberList$key } from "@/__generated__/GroupMemberList.graphql";
import { GroupMemberListPaginationQuery } from "@/__generated__/GroupMemberListPaginationQuery.graphql";
import { LoadMore } from "@/components/LoadMore";
import { StyledLink } from "@/components/ui/StyledLink";
import { userRoute } from "@/routes";
import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { MembershipRoleButton } from "./MembershipRoleButton";

const fragment = graphql`
  fragment GroupMemberList on Group
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "GroupMemberListPaginationQuery") {
    myMembership {
      id
      role
    }
    memberships(first: $count, after: $cursor)
      @connection(key: "GroupMemberList_memberships") {
      edges {
        node {
          id
          role
          user {
            id
            username
          }
          ...MembershipRoleButton
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

  const isAdmin = group.myMembership?.role === "Admin";

  return (
    <div>
      {group.memberships.edges.map(({ node: membership }) => (
        <div
          key={membership.id}
          className="flex justify-between p-4 bg-white border"
        >
          <StyledLink href={userRoute({ username: membership.user.username })}>
            {membership.user.username}
          </StyledLink>
          <div>
            {isAdmin ? (
              <MembershipRoleButton
                membershipRef={membership}
                groupId={group.id}
              />
            ) : (
              membership.role
            )}
          </div>
        </div>
      ))}
      {group.memberships.pageInfo.hasNextPage && (
        <LoadMore loadNext={loadNext} />
      )}
    </div>
  );
};
