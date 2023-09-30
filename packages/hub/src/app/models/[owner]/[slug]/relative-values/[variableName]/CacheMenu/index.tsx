"use client";
import { clsx } from "clsx";
import { FC, ReactElement } from "react";
import { useFragment } from "react-relay";

import {
  CheckIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  XIcon,
} from "@quri/ui";

import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { BuildRelativeValuesCacheAction } from "./BuildRelativeValuesCacheAction";
import { ClearRelativeValuesCacheAction } from "./ClearRelativeValuesCacheAction";
import { RelativeValuesModelRevision$data } from "@/__generated__/RelativeValuesModelRevision.graphql";

export const CacheMenu: FC<{
  revision: RelativeValuesModelRevision$data;
  isEditable: boolean;
}> = ({ revision, isEditable }) => {
  if (!revision.forRelativeValues) {
    throw new Error("Not found");
  }

  const definition = useFragment<RelativeValuesDefinitionRevision$key>(
    RelativeValuesDefinitionRevisionFragment,
    revision.forRelativeValues.definition.currentRevision
  );

  const isEmpty = revision.forRelativeValues.cache.length === 0;

  const fullyCached =
    !isEmpty &&
    revision.forRelativeValues.cache.length >=
      definition.items.length * definition.items.length;

  const internals = (
    <div
      className={clsx(
        "flex items-center text-sm text-gray-500 px-2 py-1 rounded-sm",
        isEditable && "hover:bg-slate-200 cursor-pointer"
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
        if (!revision.forRelativeValues?.id) {
          return null; // shouldn't happen, this is mostly for type safety
        }
        return (
          <DropdownMenu>
            <DropdownMenuHeader>
              {isEmpty
                ? "Not cached"
                : `${revision.forRelativeValues.cache.length}/${
                    definition.items.length * definition.items.length
                  } pairs cached`}
            </DropdownMenuHeader>
            {!fullyCached && (
              <BuildRelativeValuesCacheAction
                exportId={revision.forRelativeValues.id}
                close={close}
              />
            )}
            {isEmpty ? null : (
              <ClearRelativeValuesCacheAction
                exportId={revision.forRelativeValues?.id}
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
