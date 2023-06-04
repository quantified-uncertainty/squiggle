"use client";
import { clsx } from "clsx";
import { FC } from "react";
import { useFragment } from "react-relay";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuAsyncActionItem,
  RefreshIcon,
} from "@quri/ui";

import { ModelRevision$data } from "@/__generated__/ModelRevision.graphql";
import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { ClearRelativeValuesCacheAction } from "./ClearRelativeValuesCacheAction";
import { BuildRelativeValuesCacheAction } from "./BuildRelativeValuesCacheAction";

export const CacheMenu: FC<{
  revision: ModelRevision$data;
}> = ({ revision }) => {
  if (!revision.forRelativeValues) {
    throw new Error("Not found");
  }

  const definition = useFragment<RelativeValuesDefinitionRevision$key>(
    RelativeValuesDefinitionRevisionFragment,
    revision.forRelativeValues.definition.currentRevision
  );

  const isEmpty = revision.forRelativeValues.cache.length === 0;

  return (
    <Dropdown
      render={({ close }) => {
        if (!revision.forRelativeValues?.id) {
          return null; // shouldn't happen, this is mostly for type safety
        }
        return (
          <DropdownMenu>
            <BuildRelativeValuesCacheAction
              exportId={revision.forRelativeValues.id}
              close={close}
            />
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
      <div
        className={clsx(
          "text-sm font-medium text-slate-500 bg-green-100 rounded-full px-3 py-1 cursor-pointer",
          isEmpty ? "bg-red-100" : "bg-green-100"
        )}
      >
        {isEmpty
          ? "Not cached"
          : `${revision.forRelativeValues.cache.length}/${
              definition.items.length * definition.items.length
            } pairs cached`}
      </div>
    </Dropdown>
  );
};
