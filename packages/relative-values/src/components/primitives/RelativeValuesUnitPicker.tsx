"use client";
import clsx from "clsx";
import { FC } from "react";

import { Button, Dropdown } from "@quri/ui";

import { useCore } from "../host/core.js";
import { usePresentation } from "../host/presentation.js";
import { ItemPickerMenu } from "../views/ListView/ColumnHeader.js";

/**
 * Picks the global unit (state.unit) from the items in scope. Hidden while
 * `unit` is locked.
 */
export const RelativeValuesUnitPicker: FC<{ className?: string }> = ({
  className,
}) => {
  const core = useCore();
  const { labels } = usePresentation();
  if (core.isLocked("unit") || !core.snapshot) {
    return null;
  }
  const unit = core.data.unit;
  return (
    <div className={clsx("flex", className)} data-rv-part="unit-picker">
      <Dropdown
        render={({ close }) => (
          <ItemPickerMenu
            items={core.data.universe}
            onSelect={(item) => {
              core.dispatch({ type: "setUnit", unit: item.id }, "user");
              close();
            }}
          />
        )}
      >
        <Button>
          {labels["unitPicker.label"]}: {unit?.name ?? "—"}
        </Button>
      </Dropdown>
    </div>
  );
};
