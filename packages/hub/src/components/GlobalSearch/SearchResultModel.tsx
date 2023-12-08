import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { SearchResultModel$key } from "@/__generated__/SearchResultModel.graphql";
import { NamedSearchResultBox } from "./NamedSearchResultBox";
import { SnippetText } from "./SnippetText";
import { SearchResultComponent, useEdgeFragment } from "./SearchResult";

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
    <NamedSearchResultBox name="Model">
      <div className="text-slate-700">
        {model.owner.slug}/<SnippetText>{edge.slugSnippet}</SnippetText>
      </div>
      <div className="text-xs">
        <SnippetText>{edge.textSnippet}</SnippetText>
      </div>
    </NamedSearchResultBox>
  );
};
