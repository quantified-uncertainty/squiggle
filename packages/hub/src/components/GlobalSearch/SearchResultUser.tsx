import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { SearchResultUser$key } from "@/__generated__/SearchResultUser.graphql";
import { NamedSearchResultBox } from "./NamedSearchResultBox";

export const SearchResultUser: FC<{ fragment: SearchResultUser$key }> = ({
  fragment,
}) => {
  const user = useFragment(
    graphql`
      fragment SearchResultUser on User {
        username
      }
    `,
    fragment
  );

  return (
    <NamedSearchResultBox name="User">
      <div className="text-slate-700">{user.username}</div>
    </NamedSearchResultBox>
  );
};
