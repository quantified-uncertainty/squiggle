"use client";
import { FC } from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { z } from "zod";

import { SelectFormField } from "@quri/ui";

import { ownerIcon } from "@/lib/ownerIcon";
import { OwnerDTO } from "@/owners/data/owner";

const OwnerInfo: FC<{ owner: OwnerDTO }> = ({ owner }) => {
  const Icon = ownerIcon(owner.kind);
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-slate-500" size={16} />
      <div>{owner.slug}</div>
    </div>
  );
};

export function SelectOwner<
  TValues extends FieldValues,
  TName extends FieldPathByValue<TValues, OwnerDTO | null> = FieldPathByValue<
    TValues,
    OwnerDTO | null
  >,
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
  const loadOptions = async (inputValue: string): Promise<OwnerDTO[]> => {
    const result = await fetch(
      `/api/find-owners?${new URLSearchParams({
        search: inputValue,
        mode: myOnly ? "my" : "all",
      })}`
    ).then((r) => r.json());

    const data = z
      .array(
        z.object({
          kind: z.enum(["User", "Group"]),
          id: z.string(),
          slug: z.string(),
        })
      )
      .parse(result);

    return data;
  };

  return (
    <SelectFormField<TValues, OwnerDTO | null>
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
