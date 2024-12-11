"use client";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { z } from "zod";

import { SelectFormField } from "@quri/ui";

export type SelectGroupOption = {
  id: string;
  slug: string;
};

export function SelectGroup<
  TValues extends FieldValues,
  TName extends FieldPathByValue<
    TValues,
    SelectGroupOption | null
  > = FieldPathByValue<TValues, SelectGroupOption | null>,
>({
  name,
  label,
  description,
  required = true,
  myOnly = false,
}: {
  name: TName;
  label?: string;
  description?: string;
  required?: boolean;
  myOnly?: boolean;
}) {
  const loadOptions = async (
    inputValue: string
  ): Promise<SelectGroupOption[]> => {
    if (typeof window === "undefined") {
      return [];
    }

    const result = await fetch(
      `/api/find-owners?${new URLSearchParams({
        search: inputValue,
        mode: myOnly ? "my-groups" : "all-groups",
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
    <SelectFormField<TValues, SelectGroupOption | null>
      name={name}
      label={label}
      description={description}
      required={required}
      async
      loadOptions={loadOptions}
      renderOption={(group) => group.slug}
    />
  );
}
