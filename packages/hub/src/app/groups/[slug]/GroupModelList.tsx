import { GroupModelList$key } from "@/__generated__/GroupModelList.graphql";
import { ModelList } from "@/models/components/ModelList";
import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

const Fragment = graphql`
  fragment GroupModelList on Group
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "GroupModelListPaginationQuery") {
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
  const {
    data: { models },
    loadNext,
  } = usePaginationFragment(Fragment, groupRef);

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
          {"This group doesn't have any models yet."}
        </div>
      )}
    </div>
  );
};
