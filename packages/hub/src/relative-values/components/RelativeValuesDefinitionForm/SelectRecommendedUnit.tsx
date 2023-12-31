import { FieldPathByValue, useWatch } from "react-hook-form";

import { SelectStringFormField } from "@quri/ui";

import { FormShape } from "./FormShape";

export function SelectRecommendedUnit<
  TName extends FieldPathByValue<FormShape, string | null> = FieldPathByValue<
    FormShape,
    string | null
  >,
>({ name, label }: { name: TName; label?: string }) {
  const items = useWatch<FormShape, "items">({ name: "items" }) ?? [];
  const allItemIds = items.map((item) => item.id);

  // TODO - reset value if selected item disappears
  return (
    <SelectStringFormField<FormShape>
      name={name}
      label={label}
      options={allItemIds}
      required={false}
    />
  );
}
