import { FC } from "react";
import { useFragment } from "react-relay";

import { graphql } from "relay-runtime";

import { UserLink } from "@/components/UserLink";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelRoute } from "@/routes";
import type { ModelCardFragment$key } from "@gen/ModelCardFragment.graphql";

const Fragment = graphql`
  fragment ModelCardFragment on Model {
    slug
    owner {
      username
    }
  }
`;

export const ModelCard: FC<{
  model: ModelCardFragment$key;
}> = ({ model }) => {
  const data = useFragment(Fragment, model);

  return (
    <div>
      <div>
        <StyledLink
          href={modelRoute({
            username: data.owner.username,
            slug: data.slug,
          })}
        >
          {data.slug}
        </StyledLink>{" "}
        by <UserLink user={data.owner} />
      </div>
    </div>
  );
};
