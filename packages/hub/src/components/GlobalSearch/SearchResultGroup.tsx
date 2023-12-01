import { FC } from "react";
import { graphql, useFragment } from "react-relay";
import { groupRoute, modelRoute, userRoute } from "@/routes";
import Link from "next/link";
import { NamedSearchResultBox } from "./NamedSearchResultBox";
import { SearchResultGroup$key } from "@/__generated__/SearchResultGroup.graphql";

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
    <Link href={groupRoute({ slug: group.slug })}>
      <NamedSearchResultBox name="Group">
        <div className="text-slate-700">{group.slug}</div>
      </NamedSearchResultBox>
    </Link>
  );
};
