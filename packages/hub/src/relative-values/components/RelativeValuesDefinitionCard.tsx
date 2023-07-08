import { formatDistance } from "date-fns";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { UserLink } from "@/components/UserLink";
import { StyledDefinitionLink } from "@/components/ui/StyledDefinitionLink";
import { relativeValuesRoute } from "@/routes";
import { RelativeValuesDefinitionCard$key } from "@/__generated__/RelativeValuesDefinitionCard.graphql";
import { ScaleIcon } from "@quri/ui";
import { StyledLink } from "@/components/ui/StyledLink";

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
    <div className="border p-3 rounded flex">
      <ScaleIcon size={22} className="mt-2 ml-1 mr-3 text-slate-300" />
      <div>
        <StyledLink
          href={relativeValuesRoute({
            username: definition.owner.username,
            slug: definition.slug,
          })}
        >
          {`${!!showOwner ? definition.owner.username + "/" : ""}${
            definition.slug
          }`}
        </StyledLink>
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
        </div>
      </div>
    </div>
  );
};
