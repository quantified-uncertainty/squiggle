import { FC } from "react";
import { useFragment } from "react-relay";

import { graphql } from "relay-runtime";

import type { ModelCardFragment$key } from "@gen/ModelCardFragment.graphql";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelRoute, userRoute } from "@/routes";

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
        by{" "}
        <StyledLink href={userRoute({ username: data.owner.username })}>
          @{data.owner.username}
        </StyledLink>
      </div>
    </div>
  );
};
