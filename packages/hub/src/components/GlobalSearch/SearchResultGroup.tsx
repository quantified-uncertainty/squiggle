import { SearchResultComponent } from "./SearchResult";
import { SearchResultBox } from "./SearchResultBox";
import { SearchResultTitle } from "./SearchResultTItle";
import { Snippet } from "./Snippet";

export const SearchResultGroup: SearchResultComponent<"Group"> = ({ item }) => {
  return (
    <SearchResultBox name="Group">
      <SearchResultTitle>
        <Snippet>{item.slugSnippet}</Snippet>
      </SearchResultTitle>
    </SearchResultBox>
  );
};
