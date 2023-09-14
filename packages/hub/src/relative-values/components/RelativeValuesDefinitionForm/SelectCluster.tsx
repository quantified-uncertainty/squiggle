"use client";
import { useEffect, useRef } from "react";
import { FieldPathByValue, useFormContext, useWatch } from "react-hook-form";

import { SelectFormField } from "@quri/ui";

import { ClusterInfo } from "../common/ClusterInfo";
import { FormShape } from "./FormShape";

type SelectClusterOption = Readonly<{
  id: string;
  color: string;
}>;

// This component is specific for HTMLForm (it relies on its FormShape).
// That's because it needs to `watch()` for clusters to provide options.
export function SelectCluster<
  TName extends FieldPathByValue<FormShape, string | null> = FieldPathByValue<
    FormShape,
    string | null
  >,
>({ name, label }: { name: TName; label?: string }) {
  const { resetField } = useFormContext<FormShape>();
  const needsReset = useRef<boolean>(false);

  const clusters = useWatch<FormShape, "clusters">({ name: "clusters" }) ?? [];

  useEffect(() => {
    if (needsReset.current) {
      resetField(name);
      needsReset.current = false;
    }
  });

  return (
    <SelectFormField<FormShape, string | null, SelectClusterOption, TName>
      renderOption={(option) => <ClusterInfo cluster={option} />}
      name={name}
      label={label}
      options={clusters}
      optionToFieldValue={(cluster) => cluster.id}
      fieldValueToOption={(value) => {
        const cluster = clusters.find((cluster) => cluster.id === value);
        if (!cluster) {
          // oops, cluster is missing while the value is still present, we better reset it
          console.warn(
            `Resetting ${name} because ${value} doesn't exist anymore`
          );
          // can't call `resetField` directly during render
          needsReset.current = true;
        }
        return cluster ?? null;
      }}
      getOptionValue={(option) => option.id}
    />
  );
}
