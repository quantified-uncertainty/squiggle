import { UserModelList$key } from "@/__generated__/UserModelList.graphql";
import { H1 } from "@/components/ui/Headers";
import { ModelList } from "@/models/components/ModelList";
import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

const Fragment = graphql`
  fragment UserModelList on User
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "UserModelListPaginationQuery") {
    models(first: $count, after: $cursor)
      @connection(key: "UserViewList_models") {
      edges {
        __typename
      }
      ...ModelList
    }
  }
`;

type Props = {
  dataRef: UserModelList$key;
};

export const UserModelList: FC<Props> = ({ dataRef }) => {
  const {
    data: { models },
    loadNext,
  } = usePaginationFragment(Fragment, dataRef);

  return (
    <section>
      <div className="mb-2">
        <H1>Models</H1>
      </div>
      {models.edges.length ? (
        <ModelList connectionRef={models} loadNext={loadNext} />
      ) : (
        <div className="text-slate-500">{"You don't have any models yet."}</div>
      )}
    </section>
  );
};
