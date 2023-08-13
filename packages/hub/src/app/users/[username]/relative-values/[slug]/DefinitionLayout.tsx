"use client";
import { useSession } from "next-auth/react";
import { FC, PropsWithChildren } from "react";

import {
  Cog8ToothIcon,
  Dropdown,
  DropdownMenu,
  EditIcon,
  ScaleIcon,
} from "@quri/ui";

import { EntityLayout, EntityNode } from "@/components/EntityLayout";
import { EntityTab } from "@/components/ui/EntityTab";
import {
  relativeValuesEditRoute,
  relativeValuesRoute,
  userRoute,
} from "@/routes";
import { DeleteDefinitionAction } from "./DeleteRelativeValuesDefinitionAction";

type Props = PropsWithChildren<{
  params: { username: string; slug: string };
}>;

export const DefinitionLayout: FC<Props> = ({
  params: { username, slug },
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
      headerRight={
        session?.user.username === username ? (
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
        ) : null
      }
    >
      {children}
    </EntityLayout>
  );
};
