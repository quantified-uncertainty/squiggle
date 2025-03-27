"use client";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { z } from "zod";

import { SelectFormField } from "@quri/ui";

export type SelectEpistemicAgentOption = {
  id: string;
  name: string;
};

export function SelectEpistemicAgent<TValues extends FieldValues>({
  name,
  label,
  required = true,
}: {
  name: FieldPathByValue<TValues, SelectEpistemicAgentOption | null>;
  label?: string;
  required?: boolean;
}) {
  const loadOptions = async (
    inputValue: string
  ): Promise<SelectEpistemicAgentOption[]> => {
    const result = await fetch(
      `/api/find-epistemic-agents?${new URLSearchParams({
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
    <SelectFormField<TValues, SelectEpistemicAgentOption | null>
      name={name}
      label={label}
      required={required}
      async
      loadOptions={loadOptions}
      getOptionValue={(option) => option?.id}
      getOptionLabel={(option) => option?.name}
      placeholder="Select an epistemic agent..."
    />
  );
}
