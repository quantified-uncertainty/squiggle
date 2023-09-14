import { GroupInviteList$key } from "@/__generated__/GroupInviteList.graphql";
import { GroupInviteListPaginationQuery } from "@/__generated__/GroupInviteListPaginationQuery.graphql";
import { LoadMore } from "@/components/LoadMore";
import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { GroupInviteCard } from "./GroupInviteCard";
import { H2 } from "@/components/ui/Headers";

const fragment = graphql`
  fragment GroupInviteList on Group
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "GroupInviteListPaginationQuery") {
    ...hooks_useIsGroupAdmin
    invites(first: $count, after: $cursor)
      @connection(key: "GroupInviteList_invites") {
      edges {
        node {
          id
          ...GroupInviteCard
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

type Props = {
  groupRef: GroupInviteList$key;
};

export const GroupInviteList: FC<Props> = ({ groupRef }) => {
  const { data: group, loadNext } = usePaginationFragment<
    GroupInviteListPaginationQuery,
    GroupInviteList$key
  >(fragment, groupRef);

  return group.invites?.edges.length ? (
    <div>
      <H2>Pending invites</H2>
      <div className="space-y-2">
        {group.invites.edges.map(({ node: invite }) => (
          <GroupInviteCard
            inviteRef={invite}
            groupRef={group}
            groupId={group.id}
            key={invite.id}
          />
        ))}
      </div>
      {group.invites.pageInfo.hasNextPage && <LoadMore loadNext={loadNext} />}
    </div>
  ) : null;
};
