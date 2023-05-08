import { FC } from "react";
import { useFragment } from "react-relay";

import { graphql } from "relay-runtime";

import { UserLink } from "@/components/UserLink";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelRoute } from "@/routes";
import type { ModelCardFragment$key } from "@gen/ModelCardFragment.graphql";

const ModelFragment = graphql`
  fragment ModelCardFragment on Model {
    slug
    owner {
      username
      ...UserLinkFragment
    }
  }
`;

type Props = {
  model: ModelCardFragment$key;
  showOwner?: boolean;
};

export const ModelCard: FC<Props> = ({ model, showOwner }) => {
  const data = useFragment(ModelFragment, model);

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
        </StyledLink>
        {showOwner ? (
          <span>
            {" "}
            by <UserLink user={data.owner} />
          </span>
        ) : null}
      </div>
    </div>
  );
};
