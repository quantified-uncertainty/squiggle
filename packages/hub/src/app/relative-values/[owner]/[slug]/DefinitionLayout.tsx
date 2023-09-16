"use client";
import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import {
  Cog8ToothIcon,
  Dropdown,
  DropdownMenu,
  EditIcon,
  ScaleIcon,
} from "@quri/ui";

import { DefinitionLayoutQuery } from "@/__generated__/DefinitionLayoutQuery.graphql";
import { EntityLayout, EntityNode } from "@/components/EntityLayout";
import { EntityTab } from "@/components/ui/EntityTab";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import {
  ownerRoute,
  relativeValuesEditRoute,
  relativeValuesRoute,
} from "@/routes";
import { DeleteDefinitionAction } from "./DeleteRelativeValuesDefinitionAction";

type Props = PropsWithChildren<{
  queryRef: SerializablePreloadedQuery<DefinitionLayoutQuery>;
}>;

export const DefinitionLayout: FC<Props> = ({ queryRef, children }) => {
  const [{ result }] = usePageQuery(
    graphql`
      query DefinitionLayoutQuery($input: QueryRelativeValuesDefinitionInput!) {
        result: relativeValuesDefinition(input: $input) {
          __typename
          ... on BaseError {
            message
          }
          ... on NotFoundError {
            message
          }
          ... on RelativeValuesDefinition {
            id
            slug
            isEditable
            owner {
              __typename
              slug
            }
          }
        }
      }
    `,
    queryRef
  );

  const definition = extractFromGraphqlErrorUnion(
    result,
    "RelativeValuesDefinition"
  );
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
      nodes={nodes}
      headerRight={
        definition.isEditable ? (
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
              render={({ close }) => (
                <DropdownMenu>
                  <DeleteDefinitionAction
                    owner={definition.owner.slug}
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
