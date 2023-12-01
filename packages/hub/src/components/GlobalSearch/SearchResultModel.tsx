import { FC } from "react";
import { graphql, useFragment } from "react-relay";
import { SearchResultModel$key } from "@/__generated__/SearchResultModel.graphql";
import { modelRoute } from "@/routes";
import Link from "next/link";
import { NamedSearchResultBox } from "./NamedSearchResultBox";

export const SearchResultModel: FC<{ fragment: SearchResultModel$key }> = ({
  fragment,
}) => {
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
    <Link href={modelRoute({ owner: model.owner.slug, slug: model.slug })}>
      <NamedSearchResultBox name="Model">
        <div className="text-slate-700">
          {model.owner.slug}/{model.slug}
        </div>
      </NamedSearchResultBox>
    </Link>
  );
};
