import Link from "next/link";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";
import { components, type OptionProps } from "react-select";

import { SearchResult$key } from "@/__generated__/SearchResult.graphql";
import { SearchOption } from ".";
import { SearchResultGroup } from "./SearchResultGroup";
import { SearchResultModel } from "./SearchResultModel";
import { SearchResultRelativeValuesDefinition } from "./SearchResultRelativeValuesDefinition";
import { SearchResultUser } from "./SearchResultUser";
import { SearchResultEdge$key } from "@/__generated__/SearchResultEdge.graphql";

export function useEdgeFragment(edgeFragment: SearchResultEdge$key) {
  return useFragment(
    graphql`
      fragment SearchResultEdge on SearchEdge {
        slugSnippet
        textSnippet
      }
    `,
    edgeFragment
  );
}

export type SearchResultComponent<T> = FC<{
  fragment: T;
  edgeFragment: SearchResultEdge$key;
}>;

const OkSearchResult: FC<{
  fragment: SearchResult$key;
  edgeFragment: SearchResultEdge$key;
}> = ({ fragment: objectRef, edgeFragment }) => {
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
      return (
        <SearchResultModel fragment={object} edgeFragment={edgeFragment} />
      );
    case "RelativeValuesDefinition":
      return (
        <SearchResultRelativeValuesDefinition
          fragment={object}
          edgeFragment={edgeFragment}
        />
      );
    case "User":
      return <SearchResultUser fragment={object} edgeFragment={edgeFragment} />;
    case "Group":
      return (
        <SearchResultGroup fragment={object} edgeFragment={edgeFragment} />
      );
    default:
      return (
        <div>
          Unknown result type: <strong>{object.__typename}</strong>
        </div>
      );
  }
};

export const SearchResult: FC<OptionProps<SearchOption, false>> = ({
  children,
  ...props
}) => {
  switch (props.data.type) {
    case "object":
      return (
        <components.Option {...props}>
          <Link href={props.data.link}>
            <OkSearchResult
              fragment={props.data.object}
              edgeFragment={props.data.edge}
            />
          </Link>
        </components.Option>
      );
    case "error":
      return (
        <components.Option {...props} isDisabled>
          <div className="text-xs text-red-500">
            Error: {props.data.message}
          </div>
        </components.Option>
      );
    default:
      throw new Error(`Unexpected data ${props.data satisfies never}`);
  }
};
