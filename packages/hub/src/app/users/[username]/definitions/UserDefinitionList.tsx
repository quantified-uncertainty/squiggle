import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { UserDefinitionList$key } from "@/__generated__/UserDefinitionList.graphql";
import { RelativeValuesDefinitionList } from "@/relative-values/components/RelativeValuesDefinitionList";
import { StyledLink } from "@/components/ui/StyledLink";
import { newDefinitionRoute } from "@/routes";

const Fragment = graphql`
  fragment UserDefinitionList on User
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "UserDefinitionListPaginationQuery") {
    relativeValuesDefinitions(first: $count, after: $cursor)
      @connection(key: "UserViewList_relativeValuesDefinitions") {
      edges {
        __typename
      }
      ...RelativeValuesDefinitionList
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
        <div className="text-slate-500">No definitions to show.</div>
      )}
    </div>
  );
};
