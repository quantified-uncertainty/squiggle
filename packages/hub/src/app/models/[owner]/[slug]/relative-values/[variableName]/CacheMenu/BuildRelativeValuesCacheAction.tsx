"use client";
import { FC } from "react";

import { RefreshIcon, useToast } from "@quri/ui";

import { ServerActionDropdownAction } from "@/components/ui/ServerActionDropdownAction";
import { buildRelativeValuesCacheAction } from "@/server/relative-values/actions/buildRelativeValuesCacheAction";
import { RelativeValuesExportFullDTO } from "@/server/relative-values/data/fullExport";

export const BuildRelativeValuesCacheAction: FC<{
  relativeValuesExport: RelativeValuesExportFullDTO;
}> = ({ relativeValuesExport }) => {
  // TODO - fill cache in ModelEvaluator and re-render
  const toast = useToast();

  return (
    <ServerActionDropdownAction
      title="Fill cache"
      icon={RefreshIcon}
      act={async () => {
        await buildRelativeValuesCacheAction({
          exportId: relativeValuesExport.id,
        });
        toast("Cache filled", "confirmation");
      }}
      invariant={1} // close is controlled by the parent
    />
  );
};
