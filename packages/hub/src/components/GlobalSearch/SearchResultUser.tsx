import { graphql, useFragment } from "react-relay";

import { SearchResultUser$key } from "@/__generated__/SearchResultUser.graphql";
import { NamedSearchResultBox } from "./NamedSearchResultBox";
import { SearchResultComponent, useEdgeFragment } from "./SearchResult";
import { SnippetText } from "./SnippetText";

export const SearchResultUser: SearchResultComponent<SearchResultUser$key> = ({
  fragment,
  edgeFragment,
}) => {
  const edge = useEdgeFragment(edgeFragment);

  // Unused, because SearchEdge.slugSnippet is better than User.username.
  useFragment(
    graphql`
      fragment SearchResultUser on User {
        username
      }
    `,
    fragment
  );

  return (
    <NamedSearchResultBox name="User">
      <div className="text-slate-700">
        <SnippetText>{edge.slugSnippet}</SnippetText>
      </div>
    </NamedSearchResultBox>
  );
};
