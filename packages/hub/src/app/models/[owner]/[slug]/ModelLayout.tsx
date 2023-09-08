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
import { ModelLayoutQuery } from "@/__generated__/ModelLayoutQuery.graphql";
import { EntityLayout } from "@/components/EntityLayout";
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";
import { EntityTab } from "@/components/ui/EntityTab";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
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

export const Fragment = graphql`
  fragment ModelLayout on Model {
    id
    slug
    isEditable
    owner {
      __typename
      slug
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
  owner: string;
}> = ({ owner, slug }) => {
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction owner={owner} slug={slug} close={close} />
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
    query: SerializablePreloadedQuery<ModelLayoutQuery>;
  }>
> = ({ query, children }) => {
  const { variableName } = useParams();

  const [{ result }] = usePageQuery(Query, query);

  const modelRef = extractFromGraphqlErrorUnion(result, "Model");
  const model = useFragment<ModelLayout$key>(Fragment, modelRef);

  useFixModelUrlCasing(model);

  const dropDown = (close: () => void) => (
    <DropdownMenu>
      <DropdownMenuHeader>Relative Value Functions</DropdownMenuHeader>
      <DropdownMenuSeparator />
      {model.currentRevision.relativeValuesExports.map((exportItem) => (
        <DropdownMenuLinkItem
          key={exportItem.variableName}
          href={modelForRelativeValuesExportRoute({
            owner: model.owner.slug,
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

  const modelUrl = modelRoute({ owner: model.owner.slug, slug: model.slug });
  const modelRevisionsUrl = modelRevisionsRoute({
    owner: model.owner.slug,
    slug: model.slug,
  });

  return (
    <EntityLayout
      nodes={entityNodes(model.owner, model.slug, variableName)}
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
            <MenuButton slug={model.slug} owner={model.owner.slug} />
          ) : null}
        </EntityTab.List>
      }
    >
      {children}
    </EntityLayout>
  );
};
