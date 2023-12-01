import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { SearchResult$key } from "@/__generated__/SearchResult.graphql";
import { SearchResultBox } from "./SearchResultBox";
import { SearchResultModel } from "./SearchResultModel";
import { SearchResultRelativeValuesDefinition } from "./SearchResultRelativeValuesDefinition";
import { SearchResultUser } from "./SearchResultUser";
import { SearchResultGroup } from "./SearchResultGroup";

export const SearchResult: FC<{ objectRef: SearchResult$key }> = ({
  objectRef,
}) => {
  const object = useFragment(
    graphql`
      fragment SearchResult on SearchableObject {
        __typename
        ...SearchResultModel
        ...SearchResultRelativeValuesDefinition
        ...SearchResultUser
        ...SearchResultGroup
      }
    `,
    objectRef
  );

  switch (object.__typename) {
    case "Model":
      return <SearchResultModel fragment={object} />;
    case "RelativeValuesDefinition":
      return <SearchResultRelativeValuesDefinition fragment={object} />;
    case "User":
      return <SearchResultUser fragment={object} />;
    case "Group":
      return <SearchResultGroup fragment={object} />;
    default:
      return (
        <SearchResultBox hoverable={false}>
          Unknown result type: <strong>{object.__typename}</strong>
        </SearchResultBox>
      );
  }
};
