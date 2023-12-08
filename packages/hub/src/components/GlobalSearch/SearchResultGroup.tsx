import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { SearchResultGroup$key } from "@/__generated__/SearchResultGroup.graphql";
import { NamedSearchResultBox } from "./NamedSearchResultBox";
import { SearchResultComponent, useEdgeFragment } from "./SearchResult";
import { SnippetText } from "./SnippetText";

export const SearchResultGroup: SearchResultComponent<
  SearchResultGroup$key
> = ({ fragment, edgeFragment }) => {
  const edge = useEdgeFragment(edgeFragment);

  // Unused, because SearchEdge.slugSnippet is better than User.username.
  useFragment(
    graphql`
      fragment SearchResultGroup on Group {
        slug
      }
    `,
    fragment
  );

  return (
    <NamedSearchResultBox name="Group">
      <SnippetText>{edge.slugSnippet}</SnippetText>
    </NamedSearchResultBox>
  );
};
