"use client";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { z } from "zod";

import { SelectFormField } from "@quri/ui";

export type SelectEvaluatorOption = {
  id: string;
  name: string;
};

export function SelectEvaluator<TValues extends FieldValues>({
  name,
  label,
  required = true,
}: {
  name: FieldPathByValue<TValues, SelectEvaluatorOption | null>;
  label?: string;
  required?: boolean;
}) {
  const loadOptions = async (
    inputValue: string
  ): Promise<SelectEvaluatorOption[]> => {
    const result = await fetch(
      `/api/find-evaluators?${new URLSearchParams({
        search: inputValue,
      })}`
    ).then((r) => r.json());

    const data = z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
        })
      )
      .parse(result);

    return data;
  };

  return (
    <SelectFormField<TValues, SelectEvaluatorOption | null>
      name={name}
      label={label}
      required={required}
      async
      loadOptions={loadOptions}
      getOptionValue={(option) => option?.id}
      getOptionLabel={(option) => option?.name}
      placeholder="Select an evaluator..."
    />
  );
}
