"use client";

import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { CodeBracketIcon, RectangleStackIcon, ShareIcon } from "@quri/ui";

import { ModelLayoutQuery } from "@/__generated__/ModelLayoutQuery.graphql";
import { EntityLayout } from "@/components/EntityLayout";
import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { EntityTab } from "@/components/ui/EntityTab";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import {
  modelExportRoute,
  modelForRelativeValuesExportRoute,
  modelRevisionsRoute,
  modelRoute,
} from "@/routes";
import { useFixModelUrlCasing } from "./FixModelUrlCasing";
import { ModelAccessControls } from "./ModelAccessControls";
import { ModelSettingsButton } from "./ModelSettingsButton";
import { ModelEntityNodes } from "./ModelEntityNodes";
import { ExportsDropdown } from "@/lib/ExportsDropdown";

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
  const [{ result }] = usePageQuery(Query, query);

  const model = extractFromGraphqlErrorUnion(result, "Model");

  useFixModelUrlCasing(model);

  const relativeValuesExports = model.currentRevision.relativeValuesExports;

  const modelUrl = modelRoute({ owner: model.owner.slug, slug: model.slug });
  const modelRevisionsUrl = modelRevisionsRoute({
    owner: model.owner.slug,
    slug: model.slug,
  });

  return (
    <EntityLayout
      nodes={<ModelEntityNodes owner={model.owner} />}
      isFluid={true}
      headerLeft={<ModelAccessControls modelRef={model} />}
      headerRight={
        <EntityTab.List>
          <EntityTab.Link name="Code" icon={CodeBracketIcon} href={modelUrl} />
          {Boolean(
            relativeValuesExports.length || model.currentRevision.exports.length
          ) && (
            <ExportsDropdown
              modelExports={model.currentRevision.exports.map(
                ({ variableName, title }) => ({
                  variableName,
                  title: title || variableName,
                })
              )}
              relativeValuesExports={model.currentRevision.relativeValuesExports.map(
                ({ variableName, definition: { slug } }) => ({
                  variableName,
                  slug,
                })
              )}
              owner={model.owner.slug}
              slug={model.slug}
            >
              <EntityTab.Div
                name="Exports"
                icon={ShareIcon}
                count={model.currentRevision.exports.length}
                selected={(pathname) => {
                  return (
                    pathname.startsWith(modelUrl + "/relative-values") ||
                    pathname.startsWith(modelUrl + "/exports")
                  );
                }}
              />
            </ExportsDropdown>
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
