"use client";
import { FC, PropsWithChildren } from "react";

import {
  Cog8ToothIcon,
  Dropdown,
  DropdownMenu,
  EditIcon,
  ScaleIcon,
} from "@quri/ui";

import { EntityInfo } from "@/components/EntityInfo";
import { EntityLayout, EntityNode } from "@/components/EntityLayout";
import { EntityTab } from "@/components/ui/EntityTab";
import {
  ownerRoute,
  relativeValuesEditRoute,
  relativeValuesRoute,
} from "@/routes";
import { RelativeValuesDefinitionCardDTO } from "@/server/relative-values/data/cards";

import { DeleteDefinitionAction } from "./DeleteRelativeValuesDefinitionAction";

type Props = PropsWithChildren<{
  definition: RelativeValuesDefinitionCardDTO;
  isEditable: boolean;
}>;

export const DefinitionLayout: FC<Props> = ({
  definition,
  isEditable,
  children,
}) => {
  const slug = definition.slug;

  const nodes: EntityNode[] = [
    { slug: definition.owner.slug, href: ownerRoute(definition.owner) },
    {
      slug,
      href: relativeValuesRoute({ owner: definition.owner.slug, slug }),
      icon: ScaleIcon,
    },
  ];

  return (
    <EntityLayout
      nodes={<EntityInfo nodes={nodes} />}
      headerRight={
        isEditable ? (
          <EntityTab.List>
            <EntityTab.Link
              name="View"
              icon={ScaleIcon}
              href={relativeValuesRoute({ owner: definition.owner.slug, slug })}
            />
            <EntityTab.Link
              name="Edit"
              icon={EditIcon}
              href={relativeValuesEditRoute({
                owner: definition.owner.slug,
                slug,
              })}
            />
            <Dropdown
              render={() => (
                <DropdownMenu>
                  <DeleteDefinitionAction
                    owner={definition.owner.slug}
                    slug={slug}
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
