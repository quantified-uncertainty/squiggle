import React, { FC, PropsWithChildren } from "react";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuHeader,
  ScaleIcon,
} from "@quri/ui";

import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { modelForRelativeValuesExportRoute, variableRoute } from "@/routes";

import { exportTypeIcon } from "./typeIcon";

export type VariableRevision = {
  title?: string;
  variableName: string;
  variableType?: string;
  docstring?: string;
};

type RelativeValuesExport = { slug: string; variableName: string };

const nonRelativeValuesVariables = (
  variables: VariableRevision[],
  relativeValuesExports: RelativeValuesExport[]
) =>
  variables.filter(
    (exportItem) =>
      !relativeValuesExports.find(
        ({ variableName: v }) => v === exportItem.variableName
      )
  );

//It's a bit awkward that this here, but it's fairly closely coupled to ExportsDropdown.
export const totalImportLength = (
  variables: VariableRevision[],
  relativeValuesExports: RelativeValuesExport[]
) =>
  nonRelativeValuesVariables(variables, relativeValuesExports).length +
  relativeValuesExports.length;

export const VariablesDropdown: FC<
  PropsWithChildren<{
    variableRevisions: VariableRevision[];
    relativeValuesExports: RelativeValuesExport[];
    owner: string;
    slug: string;
  }>
> = ({ variableRevisions, relativeValuesExports, owner, slug, children }) => {
  //We remove the relative values variables from the exports list, to not double count them.
  const _variableRevisions = nonRelativeValuesVariables(
    variableRevisions,
    relativeValuesExports
  );
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {_variableRevisions.length > 0 && (
            <>
              <DropdownMenuHeader>Exported Variables</DropdownMenuHeader>
              {_variableRevisions.map((exportItem) => (
                <DropdownMenuNextLinkItem
                  key={exportItem.variableName}
                  href={variableRoute({
                    owner: owner,
                    modelSlug: slug,
                    variableName: exportItem.variableName,
                  })}
                  title={`${exportItem.title || exportItem.variableName}`}
                  icon={exportTypeIcon(exportItem.variableType || "")}
                  close={close}
                />
              ))}{" "}
            </>
          )}
          {relativeValuesExports.length > 0 && (
            <>
              <DropdownMenuHeader>Relative Value Functions</DropdownMenuHeader>
              {relativeValuesExports.map((exportItem) => (
                <DropdownMenuNextLinkItem
                  key={exportItem.variableName}
                  href={modelForRelativeValuesExportRoute({
                    owner: owner,
                    slug: slug,
                    variableName: exportItem.variableName,
                  })}
                  title={`${exportItem.variableName}: ${exportItem.slug}`}
                  icon={ScaleIcon}
                  close={close}
                />
              ))}
            </>
          )}
        </DropdownMenu>
      )}
    >
      {children}
    </Dropdown>
  );
};
