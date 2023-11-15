import React, { FC, useMemo, useState } from "react";
import { PropsWithChildren } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { graphql, useFragment } from "react-relay";

import {
  ButtonWithDropdown,
  CommentIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuHeader,
  DropdownMenuModalActionItem,
  LinkIcon,
  ScaleIcon,
  ShareIcon,
  TextAreaFormField,
  TextTooltip,
} from "@quri/ui";
import { modelExportRoute, modelForRelativeValuesExportRoute } from "@/routes";
import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";

type ModelExport = { variableName: string; title?: string };
type RelativeValuesExport = { slug: string; variableName: string };

const nonRelativeValuesExports = (
  modelExports: ModelExport[],
  relativeValuesExports: RelativeValuesExport[]
) =>
  modelExports.filter(
    (exportItem) =>
      !relativeValuesExports.find(
        ({ variableName: v }) => v === exportItem.variableName
      )
  );

//It's a bit awkward that this here, but it's fairly closely coupled to ExportsDropdown.
export const totalImportLength = (
  modelExports: ModelExport[],
  relativeValuesExports: RelativeValuesExport[]
) =>
  nonRelativeValuesExports(modelExports, relativeValuesExports).length +
  relativeValuesExports.length;

export const ExportsDropdown: FC<
  PropsWithChildren<{
    modelExports: ModelExport[];
    relativeValuesExports: RelativeValuesExport[];
    owner: string;
    slug: string;
  }>
> = ({ modelExports, relativeValuesExports, owner, slug, children }) => {
  //We remove the relative values exports from the exports list, to not double count them.
  const exports = nonRelativeValuesExports(modelExports, relativeValuesExports);
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {exports.length > 0 && (
            <>
              <DropdownMenuHeader>Exports</DropdownMenuHeader>
              {exports.map((exportItem) => (
                <DropdownMenuNextLinkItem
                  key={exportItem.variableName}
                  href={modelExportRoute({
                    owner: owner,
                    slug: slug,
                    variableName: exportItem.variableName,
                  })}
                  title={`${exportItem.title || exportItem.variableName}`}
                  icon={ShareIcon}
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
