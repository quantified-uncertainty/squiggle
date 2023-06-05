import { formatDistance } from "date-fns";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { UserLink } from "@/components/UserLink";
import { StyledDefinitionLink } from "@/components/ui/StyledDefinitionLink";
import { relativeValuesRoute } from "@/routes";
import { RelativeValuesDefinitionCard$key } from "@/__generated__/RelativeValuesDefinitionCard.graphql";

const Fragment = graphql`
  fragment RelativeValuesDefinitionCard on RelativeValuesDefinition {
    slug
    createdAtTimestamp
    owner {
      username
      ...UserLinkFragment
    }
  }
`;

type Props = {
  definitionRef: RelativeValuesDefinitionCard$key;
  showOwner?: boolean;
};

export const RelativeValuesDefinitionCard: FC<Props> = ({
  definitionRef,
  showOwner,
}) => {
  const definition = useFragment(Fragment, definitionRef);

  return (
    <div className="border p-2 rounded">
      <div>
        <div>
          <StyledDefinitionLink
            href={relativeValuesRoute({
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
