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
  modelRef: ModelCardFragment$key;
  showOwner?: boolean;
};

export const ModelCard: FC<Props> = ({ modelRef, showOwner }) => {
  const model = useFragment(ModelFragment, modelRef);

  return (
    <div className="border p-2 rounded">
      <div>
        <div>
          <StyledLink
            href={modelRoute({
              username: model.owner.username,
              slug: model.slug,
            })}
          >
            {model.slug}
          </StyledLink>
        </div>
        <div className="text-xs text-slate-500">
          Created{" "}
          <time dateTime={new Date(model.createdAtTimestamp).toISOString()}>
            {formatDistance(new Date(model.createdAtTimestamp), new Date(), {
              addSuffix: true,
            })}
          </time>
          {showOwner ? (
            <span>
              {" "}
              by <UserLink userRef={model.owner} />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
