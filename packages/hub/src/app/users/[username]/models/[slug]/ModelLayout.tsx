"use client";

import { useParams } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import {
  CodeBracketIcon,
  Cog8ToothIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  RectangleStackIcon,
  ScaleIcon,
} from "@quri/ui";

import { ModelLayout$key } from "@/__generated__/ModelLayout.graphql";
import ModelLayoutQueryNode, {
  ModelLayoutQuery,
} from "@/__generated__/ModelLayoutQuery.graphql";
import { Owner$key } from "@/__generated__/Owner.graphql";
import { EntityLayout } from "@/components/EntityLayout";
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";
import { EntityTab } from "@/components/ui/EntityTab";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import {
  modelForRelativeValuesExportRoute,
  modelRevisionsRoute,
  modelRoute,
} from "@/routes";
import { DeleteModelAction } from "./DeleteModelAction";
import { useFixModelUrlCasing } from "./FixModelUrlCasing";
import { ModelAccessControls } from "./ModelAccessControls";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";
import { entityNodes } from "./utils";
import { useOwner } from "@/hooks/Owner";

export const Fragment = graphql`
  fragment ModelLayout on Model {
    id
    slug
    isEditable
    owner {
      ...Owner
    }
    ...FixModelUrlCasing
    ...ModelAccessControls
    currentRevision {
      id
      # for length; TODO - "hasExports" field?
      relativeValuesExports {
        id
        variableName
        definition {
          slug
        }
      }
    }
  }
`;

// Doing this with a fragment would be too hard, because of how layouts work in Next.js.
// So we have to do two GraphQL queries on most model pages.
const Query = graphql`
  query ModelLayoutQuery($input: QueryModelInput!) {
    result: model(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on Model {
        ...ModelLayout
      }
    }
  }
`;

const MenuButton: FC<{
  slug: string;
  owner: Owner$key;
}> = ({ owner, slug }) => {
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction ownerRef={owner} slug={slug} close={close} />
          <DeleteModelAction owner={owner} slug={slug} close={close} />
        </DropdownMenu>
      )}
    >
      <EntityTab.Div name="Settings" icon={Cog8ToothIcon} />
    </Dropdown>
  );
};

export const ModelLayout: FC<
  PropsWithChildren<{
    query: SerializablePreloadedQuery<
      typeof ModelLayoutQueryNode,
      ModelLayoutQuery
    >;
  }>
> = ({ query, children }) => {
  const { variableName } = useParams();

  const [{ result }] = usePageQuery(query, Query);

  const modelRef = extractFromGraphqlErrorUnion(result, "Model");
  const model = useFragment<ModelLayout$key>(Fragment, modelRef);
  const owner = useOwner(model.owner);

  useFixModelUrlCasing(model);

  const dropDown = (close: () => void) => (
    <DropdownMenu>
      <DropdownMenuHeader>Relative Value Functions</DropdownMenuHeader>
      <DropdownMenuSeparator />
      {model.currentRevision.relativeValuesExports.map((exportItem) => (
        <DropdownMenuLinkItem
          key={exportItem.variableName}
          href={modelForRelativeValuesExportRoute({
            owner,
            slug: model.slug,
            variableName: exportItem.variableName,
          })}
          title={`${exportItem.variableName}: ${exportItem.definition.slug}`}
          icon={ScaleIcon}
          close={close}
        />
      ))}
    </DropdownMenu>
  );

  const modelUrl = modelRoute({
    owner,
    slug: model.slug,
  });
  const modelRevisionsUrl = modelRevisionsRoute({
    owner,
    slug: model.slug,
  });

  const ownerData = useOwner(model.owner);

  return (
    <EntityLayout
      nodes={entityNodes(ownerData, model.slug, variableName)}
      isFluid={true}
      headerLeft={<ModelAccessControls modelRef={model} />}
      headerRight={
        <EntityTab.List>
          <EntityTab.Link name="Code" icon={CodeBracketIcon} href={modelUrl} />
          {Boolean(model.currentRevision.relativeValuesExports.length) && (
            <Dropdown render={({ close }) => dropDown(close)}>
              <EntityTab.Div
                name="Exports"
                icon={ScaleIcon}
                count={model.currentRevision.relativeValuesExports.length}
                selected={(pathname) => {
                  return pathname.startsWith(modelUrl + "/relative-values");
                }}
              />
            </Dropdown>
          )}
          <EntityTab.Link
            name="Revisions"
            icon={RectangleStackIcon}
            href={modelRevisionsUrl}
          />
          {model.isEditable ? (
            <MenuButton slug={model.slug} owner={model.owner} />
          ) : null}
        </EntityTab.List>
      }
    >
      {children}
    </EntityLayout>
  );
};
