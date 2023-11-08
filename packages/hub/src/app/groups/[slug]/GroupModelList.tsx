import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { GroupModelList$key } from "@/__generated__/GroupModelList.graphql";
import { ModelList } from "@/models/components/ModelList";
import { useIsGroupMember } from "./hooks";

const Fragment = graphql`
  fragment GroupModelList on Group
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "GroupModelListPaginationQuery") {
    ...hooks_useIsGroupMember
    models(first: $count, after: $cursor)
      @connection(key: "GroupModelList_models") {
      edges {
        __typename
      }
      ...ModelList
    }
  }
`;

type Props = {
  groupRef: GroupModelList$key;
};

export const GroupModelList: FC<Props> = ({ groupRef }) => {
  const { data: group, loadNext } = usePaginationFragment(Fragment, groupRef);

  const { models } = group;
  const isMember = useIsGroupMember(group);

  return (
    <div>
      {models.edges.length ? (
        <ModelList
          connectionRef={models}
          loadNext={loadNext}
          showOwner={false}
        />
      ) : (
        <div className="text-slate-500">
          {isMember
            ? "This group doesn't have any models."
            : "This group does not have any public models."}
        </div>
      )}
    </div>
  );
};
