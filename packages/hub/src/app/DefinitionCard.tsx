import { formatDistance } from "date-fns";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { DefinitionCardFragment$key } from "@/__generated__/DefinitionCardFragment.graphql";
import { UserLink } from "@/components/UserLink";
import { StyledDefinitionLink } from "@/components/ui/StyledDefinitionLink";
import { definitionRoute } from "@/routes";

const Fragment = graphql`
  fragment DefinitionCardFragment on Definition {
    slug
    createdAtTimestamp
    owner {
      username
      ...UserLinkFragment
    }
  }
`;

type Props = {
  definitionRef: DefinitionCardFragment$key;
  showOwner?: boolean;
};

export const DefinitionCard: FC<Props> = ({ definitionRef, showOwner }) => {
  const definition = useFragment(Fragment, definitionRef);

  return (
    <div className="border p-2 rounded">
      <div>
        <div>
          <StyledDefinitionLink
            href={definitionRoute({
              username: definition.owner.username,
              slug: definition.slug,
            })}
          >
            {definition.slug}
          </StyledDefinitionLink>
        </div>
        <div className="text-xs text-slate-500">
          Created{" "}
          <time
            dateTime={new Date(definition.createdAtTimestamp).toISOString()}
          >
            {formatDistance(
              new Date(definition.createdAtTimestamp),
              new Date(),
              {
                addSuffix: true,
              }
            )}
          </time>
          {showOwner ? (
            <span>
              {" "}
              by <UserLink userRef={definition.owner} />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
