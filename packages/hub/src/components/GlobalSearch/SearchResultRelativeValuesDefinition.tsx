import { graphql, useFragment } from "react-relay";

import { SearchResultRelativeValuesDefinition$key } from "@/__generated__/SearchResultRelativeValuesDefinition.graphql";
import { SearchResultBox } from "./SearchResultBox";
import { SearchResultComponent } from "./SearchResult";
import { Snippet } from "./Snippet";
import { SearchResultTitle } from "./SearchResultTItle";

export const SearchResultRelativeValuesDefinition: SearchResultComponent<
  SearchResultRelativeValuesDefinition$key
> = ({ fragment }) => {
  const definition = useFragment(
    graphql`
      fragment SearchResultRelativeValuesDefinition on RelativeValuesDefinition {
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
        {definition.owner.slug}/<Snippet>{definition.slug}</Snippet>
      </SearchResultTitle>
    </SearchResultBox>
  );
};
