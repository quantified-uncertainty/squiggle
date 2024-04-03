"use client";

import { FC } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import { ModelExportList } from "@/modelExports/components/ModelExportList";

import { FrontPageModelExportList$key } from "@/__generated__/FrontPageModelExportList.graphql";
import { FrontPageModelExportListPaginationQuery } from "@/__generated__/FrontPageModelExportListPaginationQuery.graphql";

const Fragment = graphql`
  fragment FrontPageModelExportList on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "FrontPageModelExportListPaginationQuery") {
    modelExports(first: $count, after: $cursor)
      @connection(key: "FrontPageModelExportList_modelExports") {
      # necessary for Relay
      edges {
        __typename
      }
      ...ModelExportList
    }
  }
`;

type Props = {
  dataRef: FrontPageModelExportList$key;
};

export const FrontPageModelExportList: FC<Props> = ({ dataRef }) => {
  const {
    data: { modelExports },
    loadNext,
  } = usePaginationFragment<
    FrontPageModelExportListPaginationQuery,
    FrontPageModelExportList$key
  >(Fragment, dataRef);

  return <ModelExportList connectionRef={modelExports} loadNext={loadNext} />;
};
