import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { DotsDropdownButton } from "@/components/ui/DotsDropdownButton";
import {
  userRoute,
  relativeValuesEditRoute,
  relativeValuesRoute,
} from "@/routes";
import {
  Cog8ToothIcon,
  Dropdown,
  DropdownMenu,
  EditIcon,
  PlayIcon,
  ScaleIcon,
} from "@quri/ui";
import { DeleteDefinitionAction } from "./DeleteRelativeValuesDefinitionAction";
import { useSession } from "next-auth/react";
import { EntityLayout, entityNode } from "@/components/EntityLayout";
import { EntityTab } from "@/components/ui/EntityTab";

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
            </EntityTab.List>
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
          </>
        ) : null
      }
    >
      {children}
    </EntityLayout>
  );
};
