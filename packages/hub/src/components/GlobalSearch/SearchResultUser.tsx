import { SearchResultComponent } from "./SearchResult";
import { SearchResultBox } from "./SearchResultBox";
import { SearchResultTitle } from "./SearchResultTItle";
import { Snippet } from "./Snippet";

export const SearchResultUser: SearchResultComponent<"User"> = ({ item }) => {
  return (
    <SearchResultBox name="User">
      <SearchResultTitle>
        <Snippet>{item.slugSnippet}</Snippet>
      </SearchResultTitle>
    </SearchResultBox>
  );
};
