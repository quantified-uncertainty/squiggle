import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { VariableList } from "@/variables/components/VariableList";

import { UserVariableList$key } from "@/__generated__/UserVariableList.graphql";

const Fragment = graphql`
  fragment UserVariableList on User
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "UserVariableListPaginationQuery") {
    variables(first: $count, after: $cursor)
      @connection(key: "UserVariableList_variables") {
      edges {
        __typename
      }
      ...VariableList
    }
  }
`;

type Props = {
  dataRef: UserVariableList$key;
};

export const UserVariableList: FC<Props> = ({ dataRef }) => {
  const {
    data: { variables },
    loadNext,
  } = usePaginationFragment(Fragment, dataRef);

  return (
    <div>
      {variables.edges.length ? (
        <VariableList connectionRef={variables} loadNext={loadNext} />
      ) : (
        <div className="text-slate-500">No modelExport to show.</div>
      )}
    </div>
  );
};
