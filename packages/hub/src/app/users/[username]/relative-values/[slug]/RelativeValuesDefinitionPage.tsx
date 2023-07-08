import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { DotsDropdownButton } from "@/components/ui/DotsDropdownButton";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import {
  userRoute,
  relativeValuesEditRoute,
  relativeValuesRoute,
} from "@/routes";
import { DropdownMenu, ScaleIcon } from "@quri/ui";
import { DeleteDefinitionAction } from "./DeleteRelativeValuesDefinitionAction";
import { useSession } from "next-auth/react";
import { EntityLayout, entityNode } from "@/components/EntityLayout";

export const RelativeValuesDefinitionPageFragment = graphql`
  fragment RelativeValuesDefinitionPage on RelativeValuesDefinition {
    id
    slug
    owner {
      username
    }
    currentRevision {
      ...RelativeValuesDefinitionRevision
    }
    modelExports {
      id
      variableName
      modelRevision {
        model {
          owner {
            username
          }
          slug
        }
      }
    }
  }
`;

export const RelativeValuesDefinitionPageQuery = graphql`
  query RelativeValuesDefinitionPageQuery(
    $input: QueryRelativeValuesDefinitionInput!
  ) {
    relativeValuesDefinition(input: $input) {
      ...RelativeValuesDefinitionPage
    }
  }
`;

type Props = PropsWithChildren<{
  username: string;
  slug: string;
}>;

export const RelativeValuesDefinitionPage: FC<Props> = ({
  username,
  slug,
  children,
}) => {
  const { data: session } = useSession();

  const nodes: entityNode[] = [
    { slug: username, href: userRoute({ username }) },
    { slug, href: relativeValuesRoute({ username, slug }), icon: ScaleIcon },
  ];

  return (
    <EntityLayout
      nodes={nodes}
      headerChildren={
        session?.user.username === username ? (
          <>
            <StyledTabLink.List>
              <StyledTabLink
                name="View"
                href={relativeValuesRoute({ username, slug })}
              />
              <StyledTabLink
                name="Edit"
                href={relativeValuesEditRoute({ username, slug })}
              />
            </StyledTabLink.List>
            <DotsDropdownButton>
              {({ close }) => (
                <DropdownMenu>
                  <DeleteDefinitionAction
                    username={username}
                    slug={slug}
                    close={close}
                  />
                </DropdownMenu>
              )}
            </DotsDropdownButton>
          </>
        ) : null
      }
    >
      {children}
    </EntityLayout>
  );
};
