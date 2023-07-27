import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { EntityLayout, EntityNode } from "@/components/EntityLayout";
import { EntityTab } from "@/components/ui/EntityTab";
import {
  relativeValuesEditRoute,
  relativeValuesRoute,
  userRoute,
} from "@/routes";
import {
  Cog8ToothIcon,
  Dropdown,
  DropdownMenu,
  EditIcon,
  ScaleIcon,
} from "@quri/ui";
import { useSession } from "next-auth/react";
import { DeleteDefinitionAction } from "./DeleteRelativeValuesDefinitionAction";

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
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on RelativeValuesDefinition {
        ...RelativeValuesDefinitionPage
      }
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

  const nodes: EntityNode[] = [
    { slug: username, href: userRoute({ username }) },
    { slug, href: relativeValuesRoute({ username, slug }), icon: ScaleIcon },
  ];

  return (
    <EntityLayout
      nodes={nodes}
      headerChildren={
        session?.user.username === username ? (
          <>
            <EntityTab.List>
              <EntityTab.Link
                name="View"
                icon={ScaleIcon}
                href={relativeValuesRoute({ username, slug })}
              />
              <EntityTab.Link
                name="Edit"
                icon={EditIcon}
                href={relativeValuesEditRoute({ username, slug })}
              />
              <Dropdown
                render={({ close }) => (
                  <DropdownMenu>
                    <DeleteDefinitionAction
                      username={username}
                      slug={slug}
                      close={close}
                    />
                  </DropdownMenu>
                )}
              >
                <EntityTab.Div name="Settings" icon={Cog8ToothIcon} />
              </Dropdown>
            </EntityTab.List>
          </>
        ) : null
      }
    >
      {children}
    </EntityLayout>
  );
};
