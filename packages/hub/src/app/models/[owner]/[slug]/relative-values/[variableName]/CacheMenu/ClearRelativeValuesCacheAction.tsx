"use strict";
import { FC } from "react";

import { TrashIcon, useToast } from "@quri/ui";

import { SafeActionDropdownAction } from "@/components/ui/SafeActionDropdownAction";
import { clearRelativeValuesCacheAction } from "@/relative-values/actions/clearRelativeValuesCacheAction";
import { RelativeValuesExportFullDTO } from "@/relative-values/data/fullExport";

export const ClearRelativeValuesCacheAction: FC<{
  relativeValuesExport: RelativeValuesExportFullDTO;
}> = ({ relativeValuesExport }) => {
  // TODO - clear cache in ModelEvaluator and re-render
  const toast = useToast();

  return (
    <SafeActionDropdownAction
      title="Clear cache"
      icon={TrashIcon}
      action={clearRelativeValuesCacheAction}
      input={{ exportId: relativeValuesExport.id }}
      onSuccess={() => {
        toast("Cache cleared", "confirmation");
      }}
      invariant={1} // close is controlled by the parent
    />
  );
};
