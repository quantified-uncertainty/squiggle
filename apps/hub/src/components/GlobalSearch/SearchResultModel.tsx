import { SearchResultComponent } from "./SearchResult";
import { SearchResultBox } from "./SearchResultBox";
import { SearchResultTitle } from "./SearchResultTItle";
import { Snippet } from "./Snippet";
import { TextSnippet } from "./TextSnippet";

export const SearchResultModel: SearchResultComponent<"Model"> = ({ item }) => {
  const model = item.object;

  return (
    <SearchResultBox name="Model">
      <SearchResultTitle>
        {model.owner}/<Snippet>{item.slugSnippet}</Snippet>
      </SearchResultTitle>
      <TextSnippet>{item.textSnippet}</TextSnippet>
    </SearchResultBox>
  );
};
