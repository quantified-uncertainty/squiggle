import { UserDefinitionList$key } from "@/__generated__/UserDefinitionList.graphql";
import { UserModelList$key } from "@/__generated__/UserModelList.graphql";
import { Header2 } from "@/components/ui/Header2";
import { ModelList } from "@/models/components/ModelList";
import { RelativeValuesDefinitionList } from "@/relative-values/components/RelativeValuesDefinitionList";
import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

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
    <section>
      <div className="mb-2">
        <Header2>Relative values definitions</Header2>
      </div>
      <RelativeValuesDefinitionList
        connectionRef={relativeValuesDefinitions}
        showOwner={true}
        loadNext={loadNext}
      />
    </section>
  );
};
