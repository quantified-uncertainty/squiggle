"use client";
import { FC } from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { z } from "zod";

import { SelectFormField } from "@quri/ui";

import { ownerIcon } from "@/lib/ownerIcon";

export type SelectOwnerOption = {
  __typename: "User" | "Group";
  id: string;
  slug: string;
};

const OwnerInfo: FC<{ owner: SelectOwnerOption }> = ({ owner }) => {
  const Icon = ownerIcon(owner.__typename);
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-slate-500" size={16} />
      <div>{owner.slug}</div>
    </div>
  );
};

export function SelectOwner<
  TValues extends FieldValues,
  TName extends FieldPathByValue<
    TValues,
    SelectOwnerOption | null
  > = FieldPathByValue<TValues, SelectOwnerOption | null>,
>({
  name,
  label,
  required = true,
  myOnly = false,
}: {
  name: TName;
  label?: string;
  required?: boolean;
  myOnly?: boolean;
}) {
  const loadOptions = async (
    inputValue: string
  ): Promise<SelectOwnerOption[]> => {
    const result = await fetch(
      `/api/find-owners?${new URLSearchParams({
        search: inputValue,
        mode: myOnly ? "my" : "all",
      })}`
    ).then((r) => r.json());

    const data = z
      .array(
        z.object({
          __typename: z.enum(["User", "Group"]),
          id: z.string(),
          slug: z.string(),
        })
      )
      .parse(result);

    return data;
  };

  return (
    <SelectFormField<TValues, SelectOwnerOption | null>
      name={name}
      label={label}
      required={required}
      async
      loadOptions={loadOptions}
      renderOption={(owner) => <OwnerInfo owner={owner} />}
      getOptionValue={(owner) => owner.id}
    />
  );
}
