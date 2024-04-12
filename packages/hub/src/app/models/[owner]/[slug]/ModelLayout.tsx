"use client";

import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { CodeBracketIcon, RectangleStackIcon, ShareIcon } from "@quri/ui";

import { EntityLayout } from "@/components/EntityLayout";
import { EntityTab } from "@/components/ui/EntityTab";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import {
  totalImportLength,
  type VariableRevision,
  VariablesDropdown,
} from "@/lib/VariablesDropdown";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelRevisionsRoute, modelRoute } from "@/routes";

import { useFixModelUrlCasing } from "./FixModelUrlCasing";
import { ModelAccessControls } from "./ModelAccessControls";
import { ModelEntityNodes } from "./ModelEntityNodes";
import { ModelSettingsButton } from "./ModelSettingsButton";

import { ModelLayoutQuery } from "@/__generated__/ModelLayoutQuery.graphql";

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
        variables {
          id
          variableName
          lastRevision {
            variableType
            title
          }
        }
        currentRevision {
          id
          # for length; TODO - "hasExports" field?
          exportNames
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

  const modelUrl = modelRoute({ owner: model.owner.slug, slug: model.slug });
  const modelRevisionsUrl = modelRevisionsRoute({
    owner: model.owner.slug,
    slug: model.slug,
  });

  const variables: VariableRevision[] = model.currentRevision.exportNames.map(
    (name) => {
      const matchingExport = model.variables.find(
        (e) => e.variableName === name
      );

      return {
        variableName: name,
        variableType: matchingExport?.lastRevision?.variableType || undefined,
        title: matchingExport?.lastRevision?.title || undefined,
      };
    }
  );

  const relativeValuesExports = model.currentRevision.relativeValuesExports.map(
    ({ variableName, definition: { slug } }) => ({
      variableName,
      slug,
    })
  );

  const _totalImportLength = totalImportLength(
    variables,
    relativeValuesExports
  );

  return (
    <EntityLayout
      nodes={<ModelEntityNodes owner={model.owner} />}
      isFluid={true}
      headerLeft={<ModelAccessControls modelRef={model} />}
      headerRight={
        <EntityTab.List>
          <EntityTab.Link name="Code" icon={CodeBracketIcon} href={modelUrl} />
          {Boolean(_totalImportLength) && (
            <VariablesDropdown
              variables={variables}
              relativeValuesExports={relativeValuesExports}
              owner={model.owner.slug}
              slug={model.slug}
            >
              <EntityTab.Div
                name="Exports"
                icon={ShareIcon}
                count={_totalImportLength}
                selected={(pathname) => {
                  return (
                    pathname.startsWith(modelUrl + "/relative-values") ||
                    pathname.startsWith(modelUrl + "/exports")
                  );
                }}
              />
            </VariablesDropdown>
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
