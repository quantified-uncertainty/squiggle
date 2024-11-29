import { SearchResultComponent } from "./SearchResult";
import { SearchResultBox } from "./SearchResultBox";
import { SearchResultTitle } from "./SearchResultTItle";
import { Snippet } from "./Snippet";

export const SearchResultRelativeValuesDefinition: SearchResultComponent<
  "RelativeValuesDefinition"
> = ({ item }) => {
  const definition = item.object;

  return (
    <SearchResultBox name="Model">
      <SearchResultTitle>
        {definition.owner}/<Snippet>{definition.slug}</Snippet>
      </SearchResultTitle>
    </SearchResultBox>
  );
};
