import { graphql, useFragment } from "react-relay";

import { SearchResultModel$key } from "@/__generated__/SearchResultModel.graphql";
import { SearchResultBox } from "./SearchResultBox";
import { SearchResultComponent, useEdgeFragment } from "./SearchResult";
import { Snippet } from "./Snippet";
import { TextSnippet } from "./TextSnippet";
import { SearchResultTitle } from "./SearchResultTItle";

export const SearchResultModel: SearchResultComponent<
  SearchResultModel$key
> = ({ fragment, edgeFragment }) => {
  const edge = useEdgeFragment(edgeFragment);
  const model = useFragment(
    graphql`
      fragment SearchResultModel on Model {
        slug
        owner {
          slug
        }
      }
    `,
    fragment
  );

  return (
    <SearchResultBox name="Model">
      <SearchResultTitle>
        {model.owner.slug}/<Snippet>{edge.slugSnippet}</Snippet>
      </SearchResultTitle>
      <TextSnippet>{edge.textSnippet}</TextSnippet>
    </SearchResultBox>
  );
};
