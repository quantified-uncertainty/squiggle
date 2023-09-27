import { FC } from "react";
import { usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { UserModelList$key } from "@/__generated__/UserModelList.graphql";
import { ModelList } from "@/models/components/ModelList";
import Link from "next/link";
import { StyledLink } from "@/components/ui/StyledLink";
import { newModelRoute } from "@/routes";

const Fragment = graphql`
  fragment UserModelList on User
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "UserModelListPaginationQuery") {
    models(first: $count, after: $cursor)
      @connection(key: "UserModelList_models") {
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
    <div>
      {models.edges.length ? (
        <ModelList
          connectionRef={models}
          loadNext={loadNext}
          showOwner={false}
        />
      ) : (
        <div className="text-slate-500">No models to show.</div>
      )}
    </div>
  );
};
