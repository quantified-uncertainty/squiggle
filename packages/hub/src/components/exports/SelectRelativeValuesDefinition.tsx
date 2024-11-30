import { FC, useEffect } from "react";
import { FieldPathByValue, FieldValues, useFormContext } from "react-hook-form";
import { z } from "zod";

import { SelectFormField } from "@quri/ui";

import { FindRelativeValuesForSelectResult } from "@/relative-values/data/findRelativeValuesForSelect";

import { SelectOwnerOption } from "../SelectOwner";

const DefinitionInfo: FC<{ option: FindRelativeValuesForSelectResult }> = ({
  option,
}) => <div>{option.slug}</div>;

export function SelectRelativeValuesDefinition<
  TValues extends FieldValues = never,
>({
  name,
  label,
  ownerFieldName,
}: {
  name: FieldPathByValue<TValues, FindRelativeValuesForSelectResult | null>;
  label?: string;
  ownerFieldName: FieldPathByValue<TValues, SelectOwnerOption | null>;
}) {
  const { watch, resetField } = useFormContext<TValues>();
  const owner: SelectOwnerOption | null = watch(ownerFieldName);

  const loadOptions = async (
    inputValue: string
  ): Promise<FindRelativeValuesForSelectResult[]> => {
    if (!owner) {
      return [];
    }
    const result = await fetch(
      `/api/find-relative-values?${new URLSearchParams({
        owner: owner.slug,
        slugContains: inputValue,
      })}`
    ).then((r) => r.json());

    const data = z
      .array(
        z.object({
          id: z.string(),
          slug: z.string(),
        })
      )
      .parse(result);

    if (!result) {
      return [];
    }

    return result;
  };

  useEffect(() => {
    resetField(name);
  }, [name, owner, resetField]);

  return (
    <SelectFormField<TValues, FindRelativeValuesForSelectResult | null>
      key={owner?.slug ?? " "} // re-render the component when owner changes; this helps with default select options on initial open
      name={name}
      label={label}
      required
      async
      loadOptions={loadOptions}
      disabled={!owner}
      renderOption={(option) => <DefinitionInfo option={option} />}
    />
  );
}
