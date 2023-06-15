"use client";
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  Path,
} from "react-hook-form";

import Select, {
  OptionProps,
  SingleValueProps,
  components,
} from "react-select";
import { ClusterInfo } from "./common/ClusterInfo";
import { ControlledFormField } from "@quri/ui";

type Option = Readonly<{
  id: string;
  color: string;
}>;

const Option = ({ children, ...props }: OptionProps<Option>) => {
  return (
    <components.Option {...props}>
      <ClusterInfo cluster={props.data} />
    </components.Option>
  );
};

const SingleValue = ({
  children,
  ...props
}: SingleValueProps<Option, false>) => {
  return (
    <components.SingleValue {...props}>
      <ClusterInfo cluster={props.data} />
    </components.SingleValue>
  );
};

export function SelectCluster<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
>({
  name,
  clusters,
  label,
}: {
  name: TName;
  clusters: readonly Option[];
  label?: string;
}) {
  return (
    <ControlledFormField name={name} label={label}>
      {({ value, onChange }) => (
        <Select
          components={{ SingleValue, Option }}
          value={clusters.find((cluster) => cluster.id === value)}
          options={clusters}
          getOptionLabel={(cluster) => cluster.id}
          getOptionValue={(cluster) => cluster.id}
          onChange={(cluster) => onChange(cluster?.id)}
        />
      )}
    </ControlledFormField>
  );
}
