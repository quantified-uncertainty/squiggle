import { GroupMemberList$key } from "@/__generated__/GroupMemberList.graphql";
import { GroupMemberListPaginationQuery } from "@/__generated__/GroupMemberListPaginationQuery.graphql";
import { StyledLink } from "@/components/ui/StyledLink";
import { userRoute } from "@/routes";
import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

const fragment = graphql`
  fragment GroupMemberList on Group
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "GroupMemberListPaginationQuery") {
    members(first: $count, after: $cursor)
      @connection(key: "GroupMemberList_members") {
      edges {
        id
        role
        node {
          id
          username
        }
      }
    }
  }
`;

type Props = {
  groupRef: GroupMemberList$key;
};

export const GroupMemberList: FC<Props> = ({ groupRef }) => {
  const {
    data: { members },
    loadNext,
  } = usePaginationFragment<
    GroupMemberListPaginationQuery,
    GroupMemberList$key
  >(fragment, groupRef);

  return (
    <div>
      {members.edges.map((membership) => (
        <div
          key={membership.id}
          className="flex justify-between p-4 bg-white border"
        >
          <StyledLink href={userRoute({ username: membership.node.username })}>
            {membership.node.username}
          </StyledLink>
          <div>{membership.role}</div>
        </div>
      ))}
    </div>
  );
};
