"use client";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { z } from "zod";

import { SelectFormField } from "@quri/ui";

export type SelectUserOption = {
  id: string;
  slug: string;
};

export function SelectUser<TValues extends FieldValues>({
  name,
  label,
  required = true,
}: {
  name: FieldPathByValue<TValues, SelectUserOption | null>;
  label?: string;
  required?: boolean;
}) {
  const loadOptions = async (
    inputValue: string
  ): Promise<SelectUserOption[]> => {
    const result = await fetch(
      `/api/find-owners?${new URLSearchParams({
        search: inputValue,
        mode: "all-users",
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

    return data;
  };

  return (
    <SelectFormField<TValues, SelectUserOption | null>
      name={name}
      label={label}
      required={required}
      async
      loadOptions={loadOptions}
      renderOption={(user) => user.slug}
    />
  );
}
