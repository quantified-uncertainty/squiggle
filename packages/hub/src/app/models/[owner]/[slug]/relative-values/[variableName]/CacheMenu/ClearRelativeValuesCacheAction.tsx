"use strict";
import { FC } from "react";

import { TrashIcon, useToast } from "@quri/ui";

import { ServerActionDropdownAction } from "@/components/ui/ServerActionDropdownAction";
import { clearRelativeValuesCacheAction } from "@/server/relative-values/actions/clearRelativeValuesCacheAction";
import { RelativeValuesExportFullDTO } from "@/server/relative-values/data/fullExport";

export const ClearRelativeValuesCacheAction: FC<{
  relativeValuesExport: RelativeValuesExportFullDTO;
}> = ({ relativeValuesExport }) => {
  // TODO - clear cache in ModelEvaluator and re-render
  const toast = useToast();

  return (
    <ServerActionDropdownAction
      title="Clear cache"
      icon={TrashIcon}
      act={async () => {
        await clearRelativeValuesCacheAction({
          exportId: relativeValuesExport.id,
        });
        toast("Cache cleared", "confirmation");
      }}
      invariant={1} // close is controlled by the parent
    />
  );
};
