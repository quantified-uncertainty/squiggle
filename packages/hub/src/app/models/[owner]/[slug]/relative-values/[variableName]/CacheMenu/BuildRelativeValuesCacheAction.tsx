"use client";
import { FC } from "react";

import { RefreshIcon, useToast } from "@quri/ui";

import { SafeActionDropdownAction } from "@/components/ui/SafeActionDropdownAction";
import { buildRelativeValuesCacheAction } from "@/relative-values/actions/buildRelativeValuesCacheAction";
import { RelativeValuesExportFullDTO } from "@/relative-values/data/fullExport";

export const BuildRelativeValuesCacheAction: FC<{
  relativeValuesExport: RelativeValuesExportFullDTO;
}> = ({ relativeValuesExport }) => {
  // TODO - fill cache in ModelEvaluator and re-render
  const toast = useToast();

  return (
    <SafeActionDropdownAction
      title="Fill cache"
      icon={RefreshIcon}
      action={buildRelativeValuesCacheAction}
      input={{ exportId: relativeValuesExport.id }}
      onSuccess={() => {
        toast("Cache filled", "confirmation");
      }}
      invariant={1} // close is controlled by the parent
    />
  );
};
