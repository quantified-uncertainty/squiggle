import { FC } from "react";
import { useFragment } from "react-relay";

import { graphql } from "relay-runtime";

import { UserLink } from "@/components/UserLink";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelRoute } from "@/routes";
import type { ModelCardFragment$key } from "@gen/ModelCardFragment.graphql";
import { formatDistance, formatRelative } from "date-fns";

const ModelFragment = graphql`
  fragment ModelCardFragment on Model {
    slug
    createdAtTimestamp
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
    <div className="border p-2 rounded">
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
        </div>
        <div className="text-xs text-slate-500">
          Created{" "}
          <time dateTime={new Date(data.createdAtTimestamp).toISOString()}>
            {formatDistance(new Date(data.createdAtTimestamp), new Date(), {
              addSuffix: true,
            })}
          </time>
          {showOwner ? (
            <span>
              {" "}
              by <UserLink user={data.owner} />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
