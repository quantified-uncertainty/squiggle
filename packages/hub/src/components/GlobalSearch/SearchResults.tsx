import { FC, PropsWithChildren } from "react";
import { PreloadedQuery, usePreloadedQuery } from "react-relay";

import { DropdownMenu, ErrorIcon } from "@quri/ui";

import { GlobalSearchQuery } from "@/__generated__/GlobalSearchQuery.graphql";
import { Query } from ".";
import { SearchResult } from "./SearchResult";
import { SearchResultBox } from "./SearchResultBox";

const ErrorResult: FC<PropsWithChildren> = ({ children }) => (
  <SearchResultBox hoverable={false}>
    <div className="text-red-500">
      <div className="flex gap-1 mb-1">
        <ErrorIcon />
        <div className="font-medium">Error</div>
      </div>
      <div className="text-xs">{children}</div>
    </div>
  </SearchResultBox>
);

export const SearchResults: FC<{
  queryRef: PreloadedQuery<GlobalSearchQuery>;
}> = ({ queryRef }) => {
  const { result } = usePreloadedQuery(Query, queryRef);

  if (result.__typename === "BaseError") {
    return <ErrorResult>{result.message}</ErrorResult>;
  }

  if (result.__typename !== "QuerySearchConnection") {
    return <ErrorResult>Error: unexpected query result</ErrorResult>;
  }

  if (!result.edges.length) {
    return (
      <SearchResultBox hoverable={false}>
        <div className="text-slate-400">No results</div>
      </SearchResultBox>
    );
  }

  return (
    <DropdownMenu>
      {result.edges.map((edge) => (
        <SearchResult key={edge.cursor} objectRef={edge.node.object} />
      ))}
    </DropdownMenu>
  );
};
