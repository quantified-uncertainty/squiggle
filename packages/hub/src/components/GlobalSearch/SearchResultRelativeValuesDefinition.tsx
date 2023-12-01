import { SearchResultModel$key } from "@/__generated__/SearchResultModel.graphql";
import { relativeValuesRoute } from "@/routes";
import Link from "next/link";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";
import { NamedSearchResultBox } from "./NamedSearchResultBox";

export const SearchResultRelativeValuesDefinition: FC<{
  fragment: SearchResultModel$key;
}> = ({ fragment }) => {
  const definition = useFragment(
    graphql`
      fragment SearchResultRelativeValuesDefinition on RelativeValuesDefinition {
        slug
        owner {
          slug
        }
      }
    `,
    fragment
  );

  return (
    <Link
      href={relativeValuesRoute({
        owner: definition.owner.slug,
        slug: definition.slug,
      })}
    >
      <NamedSearchResultBox name="Model">
        <div className="text-slate-700">
          {definition.owner.slug}/{definition.slug}
        </div>
      </NamedSearchResultBox>
    </Link>
  );
};
