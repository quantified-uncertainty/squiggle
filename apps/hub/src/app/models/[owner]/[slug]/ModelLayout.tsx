"use client";

import { FC, PropsWithChildren } from "react";

import { CodeBracketSquareIcon, RectangleStackIcon, ShareIcon } from "@quri/ui";

import { EntityLayout } from "@/components/EntityLayout";
import { EntityTab } from "@/components/ui/EntityTab";
import { modelRevisionsRoute, modelRoute } from "@/lib/routes";
import { getExportedVariableNames } from "@/models/clientUtils";
import { ModelCardDTO } from "@/models/data/cards";
import {
  totalImportLength,
  type VariableRevision,
  VariablesDropdown,
} from "@/variables/components/VariablesDropdown";

import { ModelEntityNodes } from "./ModelEntityNodes";
import { ModelPrivacyControls } from "./ModelPrivacyControls";
import { ModelSettingsButton } from "./ModelSettingsButton";
import { useFixModelUrlCasing } from "./useFixModelUrlCasing";

export const ModelLayout: FC<
  PropsWithChildren<{
    model: ModelCardDTO;
    isEditable: boolean;
  }>
> = ({ model, isEditable, children }) => {
  useFixModelUrlCasing(model);

  const modelUrl = modelRoute({ owner: model.owner.slug, slug: model.slug });
  const modelRevisionsUrl = modelRevisionsRoute({
    owner: model.owner.slug,
    slug: model.slug,
  });

  const variableRevisions: VariableRevision[] = getExportedVariableNames(
    model.currentRevision.squiggleSnippet?.code ?? ""
  ).map((name) => {
    const matchingVariable = model.variables.find(
      (e) => e.variableName === name
    );

    return {
      variableName: name,
      variableType:
        matchingVariable?.currentRevision?.variableType || undefined,
      title: matchingVariable?.currentRevision?.title || undefined,
    };
  });

  const relativeValuesExports = model.currentRevision.relativeValuesExports.map(
    ({ variableName, definition: { slug } }) => ({
      variableName,
      slug,
    })
  );

  const _totalImportLength = totalImportLength(
    variableRevisions,
    relativeValuesExports
  );

  return (
    <EntityLayout
      nodes={<ModelEntityNodes owner={model.owner} />}
      isFluid={true}
      headerLeft={
        <ModelPrivacyControls model={model} isEditable={isEditable} />
      }
      headerRight={
        <EntityTab.List>
          <EntityTab.Link
            name="Code"
            icon={CodeBracketSquareIcon}
            href={modelUrl}
          />
          {Boolean(_totalImportLength) && (
            <VariablesDropdown
              variableRevisions={variableRevisions}
              relativeValuesExports={relativeValuesExports}
              owner={model.owner.slug}
              slug={model.slug}
            >
              <EntityTab.Div
                name="Variables"
                icon={ShareIcon}
                count={_totalImportLength}
                selected={(pathname) => {
                  return (
                    pathname.startsWith(modelUrl + "/relative-values") ||
                    pathname.startsWith(modelUrl + "/variables")
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
          {isEditable ? <ModelSettingsButton model={model} /> : null}
        </EntityTab.List>
      }
    >
      {children}
    </EntityLayout>
  );
};
