import { graphql, useFragment } from "react-relay";

import { SearchResultUser$key } from "@/__generated__/SearchResultUser.graphql";
import { SearchResultBox } from "./SearchResultBox";
import { SearchResultComponent, useEdgeFragment } from "./SearchResult";
import { Snippet } from "./Snippet";
import { SearchResultTitle } from "./SearchResultTItle";

export const SearchResultUser: SearchResultComponent<SearchResultUser$key> = ({
  fragment,
  edgeFragment,
}) => {
  const edge = useEdgeFragment(edgeFragment);

  // Unused, because `SearchEdge.slugSnippet` is better than `User.username`.
  useFragment(
    graphql`
      fragment SearchResultUser on User {
        username
      }
    `,
    fragment
  );

  return (
    <SearchResultBox name="User">
      <SearchResultTitle>
        <Snippet>{edge.slugSnippet}</Snippet>
      </SearchResultTitle>
    </SearchResultBox>
  );
};
