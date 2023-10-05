import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { UserGroupList$key } from "@/__generated__/UserGroupList.graphql";
import { GroupList } from "@/groups/components/GroupList";
import { StyledLink } from "@/components/ui/StyledLink";
import { newGroupRoute } from "@/routes";

const Fragment = graphql`
  fragment UserGroupList on User
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "UserGroupListPaginationQuery") {
    groups(first: $count, after: $cursor)
      @connection(key: "UserGroupList_groups") {
      edges {
        __typename
      }
      ...GroupList
    }
  }
`;

type Props = {
  dataRef: UserGroupList$key;
};

export const UserGroupList: FC<Props> = ({ dataRef }) => {
  const {
    data: { groups },
    loadNext,
  } = usePaginationFragment(Fragment, dataRef);

  return (
    <div>
      {groups.edges.length ? (
        <GroupList connectionRef={groups} loadNext={loadNext} />
      ) : (
        <div className="text-slate-500">No groups to show.</div>
      )}
    </div>
  );
};
