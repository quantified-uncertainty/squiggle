import { FC } from "react";
import { graphql, useFragment } from "react-relay";
import { modelRoute, userRoute } from "@/routes";
import Link from "next/link";
import { NamedSearchResultBox } from "./NamedSearchResultBox";
import { SearchResultUser$key } from "@/__generated__/SearchResultUser.graphql";

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
    <Link href={userRoute({ username: user.username })}>
      <NamedSearchResultBox name="User">
        <div className="text-slate-700">{user.username}</div>
      </NamedSearchResultBox>
    </Link>
  );
};
