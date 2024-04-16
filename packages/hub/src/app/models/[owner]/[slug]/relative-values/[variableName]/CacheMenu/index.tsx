"use client";
import { clsx } from "clsx";
import { FC, ReactElement } from "react";
import { useFragment } from "react-relay";

import {
  CheckIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuHeader,
  XIcon,
} from "@quri/ui";

import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";

import { BuildRelativeValuesCacheAction } from "./BuildRelativeValuesCacheAction";
import { ClearRelativeValuesCacheAction } from "./ClearRelativeValuesCacheAction";

import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { RelativeValuesExport$data } from "@/__generated__/RelativeValuesExport.graphql";

export const CacheMenu: FC<{
  relativeValuesExport: RelativeValuesExport$data;
  isEditable: boolean;
}> = ({ relativeValuesExport, isEditable }) => {
  const definition = useFragment<RelativeValuesDefinitionRevision$key>(
    RelativeValuesDefinitionRevisionFragment,
    relativeValuesExport.definition.currentRevision
  );

  const isEmpty = relativeValuesExport.cache.length === 0;

  const fullyCached =
    !isEmpty &&
    relativeValuesExport.cache.length >=
      definition.items.length * definition.items.length;

  const internals = (
    <div
      className={clsx(
        "flex items-center rounded-sm px-2 py-1 text-sm text-gray-500",
        isEditable && "cursor-pointer hover:bg-slate-200"
      )}
    >
      {fullyCached ? (
        <>
          <CheckIcon className="text-gray-600" />
          Cached
        </>
      ) : (
        <>
          <XIcon size={12} className="mr-1" />
          Not Cached
        </>
      )}
    </div>
  );

  const withDropdown = (internals: ReactElement) => (
    <Dropdown
      render={({ close }) => {
        return (
          <DropdownMenu>
            <DropdownMenuHeader>
              {isEmpty
                ? "Not cached"
                : `${relativeValuesExport.cache.length}/${
                    definition.items.length * definition.items.length
                  } pairs cached`}
            </DropdownMenuHeader>
            {!fullyCached && (
              <BuildRelativeValuesCacheAction
                exportId={relativeValuesExport.id}
                close={close}
              />
            )}
            {isEmpty ? null : (
              <ClearRelativeValuesCacheAction
                exportId={relativeValuesExport.id}
                close={close}
              />
            )}
          </DropdownMenu>
        );
      }}
    >
      {internals}
    </Dropdown>
  );

  return isEditable ? withDropdown(internals) : internals;
};
