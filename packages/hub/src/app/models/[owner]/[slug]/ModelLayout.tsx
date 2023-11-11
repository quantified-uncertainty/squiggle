"use client";

import { useParams, usePathname } from "next/navigation";
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
  ShareIcon,
} from "@quri/ui";

import { ModelLayoutQuery } from "@/__generated__/ModelLayoutQuery.graphql";
import { EntityLayout } from "@/components/EntityLayout";
import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { EntityTab } from "@/components/ui/EntityTab";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import {
  isModelRelativeValuesRoute,
  modelExportRoute,
  modelForRelativeValuesExportRoute,
  modelRevisionsRoute,
  modelRoute,
} from "@/routes";
import { useFixModelUrlCasing } from "./FixModelUrlCasing";
import { ModelAccessControls } from "./ModelAccessControls";
import { entityNodes } from "./utils";
import { ModelSettingsButton } from "./ModelSettingsButton";
import { useRouter } from "next/router";

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
          exports {
            id
            variableName
            title
          }
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
  const pathname = usePathname();
  const { variableName } = useParams<{ variableName: string }>();

  const [{ result }] = usePageQuery(Query, query);

  const model = extractFromGraphqlErrorUnion(result, "Model");

  useFixModelUrlCasing(model);

  const relativeValuesExports = model.currentRevision.relativeValuesExports;

  //We remove the relative values exports from the exports list, to not double count them.
  const modelExports = model.currentRevision.exports.filter(
    ({ variableName }) =>
      !relativeValuesExports.find(({ variableName: v }) => v === variableName)
  );

  const dropDown = (close: () => void) => {
    return (
      <DropdownMenu>
        <DropdownMenuHeader>Exports</DropdownMenuHeader>
        {modelExports.map((exportItem) => (
          <DropdownMenuNextLinkItem
            key={exportItem.variableName}
            href={modelExportRoute({
              owner: model.owner.slug,
              slug: model.slug,
              variableName: exportItem.variableName,
            })}
            title={`${exportItem.title || exportItem.variableName}`}
            icon={ShareIcon}
            close={close}
          />
        ))}{" "}
        <DropdownMenuHeader>Relative Value Functions</DropdownMenuHeader>
        {relativeValuesExports.map((exportItem) => (
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
  };

  const modelUrl = modelRoute({ owner: model.owner.slug, slug: model.slug });
  const modelRevisionsUrl = modelRevisionsRoute({
    owner: model.owner.slug,
    slug: model.slug,
  });

  return (
    <EntityLayout
      nodes={entityNodes(
        model.owner,
        model.slug,
        variableName,
        isModelRelativeValuesRoute(pathname) ? "RELATIVE_VALUE" : "EXPORT"
      )}
      isFluid={true}
      headerLeft={<ModelAccessControls modelRef={model} />}
      headerRight={
        <EntityTab.List>
          <EntityTab.Link name="Code" icon={CodeBracketIcon} href={modelUrl} />
          {Boolean(model.currentRevision.relativeValuesExports.length) && (
            <Dropdown render={({ close }) => dropDown(close)}>
              <EntityTab.Div
                name="Exports"
                icon={ShareIcon}
                count={relativeValuesExports.length + modelExports.length}
                selected={(pathname) => {
                  return (
                    pathname.startsWith(modelUrl + "/relative-values") ||
                    pathname.startsWith(modelUrl + "/exports")
                  );
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
