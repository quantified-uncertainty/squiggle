import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { SearchResultGroup$key } from "@/__generated__/SearchResultGroup.graphql";
import { NamedSearchResultBox } from "./NamedSearchResultBox";

export const SearchResultGroup: FC<{ fragment: SearchResultGroup$key }> = ({
  fragment,
}) => {
  const group = useFragment(
    graphql`
      fragment SearchResultGroup on Group {
        slug
      }
    `,
    fragment
  );
  return (
    <NamedSearchResultBox name="Group">
      <div className="text-slate-700">{group.slug}</div>
    </NamedSearchResultBox>
  );
};
