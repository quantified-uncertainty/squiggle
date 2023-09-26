import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { UserDefinitionList$key } from "@/__generated__/UserDefinitionList.graphql";
import { RelativeValuesDefinitionList } from "@/relative-values/components/RelativeValuesDefinitionList";

const Fragment = graphql`
  fragment UserGroupList on User
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "UserGroupListPaginationQuery") {
    relativeValuesDefinitions(first: $count, after: $cursor)
      @connection(key: "UserGroupList_connection") {
      edges {
        __typename
      }
      ...GroupList
    }
  }
`;

type Props = {
  dataRef: UserDefinitionList$key;
};

export const UserDefinitionList: FC<Props> = ({ dataRef }) => {
  const {
    data: { relativeValuesDefinitions },
    loadNext,
  } = usePaginationFragment(Fragment, dataRef);

  return (
    <div>
      {relativeValuesDefinitions.edges.length ? (
        <RelativeValuesDefinitionList
          connectionRef={relativeValuesDefinitions}
          showOwner={false}
          loadNext={loadNext}
        />
      ) : (
        <div className="text-slate-500">
          {"You don't have any definitions yet."}
        </div>
      )}
    </div>
  );
};
