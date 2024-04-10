import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelExportList } from "@/modelExports/components/ModelExportList";

import { UserModelExportList$key } from "@/__generated__/UserModelExportList.graphql";

const Fragment = graphql`
  fragment UserModelExportList on User
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "UserModelExportListPaginationQuery") {
    modelExports(first: $count, after: $cursor)
      @connection(key: "UserModelExportList_modelExports") {
      edges {
        __typename
      }
      ...ModelExportList
    }
  }
`;

type Props = {
  dataRef: UserModelExportList$key;
};

export const UserModelExportList: FC<Props> = ({ dataRef }) => {
  const {
    data: { modelExports },
    loadNext,
  } = usePaginationFragment(Fragment, dataRef);

  return (
    <div>
      {modelExports.edges.length ? (
        <ModelExportList connectionRef={modelExports} loadNext={loadNext} />
      ) : (
        <div className="text-slate-500">No modelExport to show.</div>
      )}
    </div>
  );
};
