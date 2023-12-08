import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { SearchResultGroup$key } from "@/__generated__/SearchResultGroup.graphql";
import { SearchResultBox } from "./SearchResultBox";
import { SearchResultComponent, useEdgeFragment } from "./SearchResult";
import { Snippet } from "./Snippet";
import { SearchResultTitle } from "./SearchResultTItle";

export const SearchResultGroup: SearchResultComponent<
  SearchResultGroup$key
> = ({ fragment, edgeFragment }) => {
  const edge = useEdgeFragment(edgeFragment);

  // Unused, because `SearchEdge.slugSnippet` is better than `Group.slug`.
  useFragment(
    graphql`
      fragment SearchResultGroup on Group {
        slug
      }
    `,
    fragment
  );

  return (
    <SearchResultBox name="Group">
      <SearchResultTitle>
        <Snippet>{edge.slugSnippet}</Snippet>
      </SearchResultTitle>
    </SearchResultBox>
  );
};
