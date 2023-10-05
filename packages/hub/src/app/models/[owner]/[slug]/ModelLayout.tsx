"use client";

import { useParams } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import {
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  RectangleStackIcon,
  ScaleIcon,
} from "@quri/ui";

import { ModelLayoutQuery } from "@/__generated__/ModelLayoutQuery.graphql";
import { EntityLayout } from "@/components/EntityLayout";
import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { EntityTab } from "@/components/ui/EntityTab";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import {
  modelForRelativeValuesExportRoute,
  modelRevisionsRoute,
  modelRoute,
} from "@/routes";
import { useFixModelUrlCasing } from "./FixModelUrlCasing";
import { ModelAccessControls } from "./ModelAccessControls";
import { entityNodes } from "./utils";
import { ModelSettingsButton } from "./ModelSettingsButton";

// Note that we have to do two GraphQL queries on most model pages: one for layout.tsx, and one for page.tsx.
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
        id
        slug
        isEditable
        owner {
          __typename
          slug
        }
        ...FixModelUrlCasing
        ...ModelAccessControls
        ...ModelSettingsButton
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
    }
  }
`;

export const ModelLayout: FC<
  PropsWithChildren<{
    query: SerializablePreloadedQuery<ModelLayoutQuery>;
  }>
> = ({ query, children }) => {
  const { variableName } = useParams<{ variableName: string }>();

  const [{ result }] = usePageQuery(Query, query);

  const model = extractFromGraphqlErrorUnion(result, "Model");

  useFixModelUrlCasing(model);

  const dropDown = (close: () => void) => (
    <DropdownMenu>
      <DropdownMenuHeader>Relative Value Functions</DropdownMenuHeader>
      {model.currentRevision.relativeValuesExports.map((exportItem) => (
        <DropdownMenuNextLinkItem
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
          {model.isEditable ? <ModelSettingsButton model={model} /> : null}
        </EntityTab.List>
      }
    >
      {children}
    </EntityLayout>
  );
};
