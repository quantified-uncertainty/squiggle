import { graphql, useFragment } from "react-relay";

import { SearchResultRelativeValuesDefinition$key } from "@/__generated__/SearchResultRelativeValuesDefinition.graphql";
import { NamedSearchResultBox } from "./NamedSearchResultBox";
import { SearchResultComponent } from "./SearchResult";
import { SnippetText } from "./SnippetText";

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
    <NamedSearchResultBox name="Model">
      <div className="text-slate-700">
        {definition.owner.slug}/<SnippetText>{definition.slug}</SnippetText>
      </div>
    </NamedSearchResultBox>
  );
};
