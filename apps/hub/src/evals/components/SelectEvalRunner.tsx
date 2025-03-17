"use client";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { z } from "zod";

import { SelectFormField } from "@quri/ui";

export type SelectEvalRunnerOption = {
  id: string;
  name: string;
};

export function SelectEvalRunner<TValues extends FieldValues>({
  name,
  label,
  required = true,
}: {
  name: FieldPathByValue<TValues, SelectEvalRunnerOption | null>;
  label?: string;
  required?: boolean;
}) {
  const loadOptions = async (
    inputValue: string
  ): Promise<SelectEvalRunnerOption[]> => {
    const result = await fetch(
      `/api/find-eval-runners?${new URLSearchParams({
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
    <SelectFormField<TValues, SelectEvalRunnerOption | null>
      name={name}
      label={label}
      required={required}
      async
      loadOptions={loadOptions}
      getOptionValue={(option) => option?.id}
      getOptionLabel={(option) => option?.name}
      placeholder="Select an eval runner..."
    />
  );
}
