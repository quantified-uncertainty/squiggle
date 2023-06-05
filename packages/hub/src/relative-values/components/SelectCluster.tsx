"use client";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

import Select, {
  OptionProps,
  SingleValueProps,
  components,
} from "react-select";
import { ClusterInfo } from "./common/ClusterInfo";

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

export function SelectCluster<T extends FieldValues>({
  clusters,
  name,
  control,
}: {
  clusters: readonly Option[];
  name: Path<T>;
  control: Control<T>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          components={{ SingleValue, Option }}
          value={clusters.find((cluster) => cluster.id === field.value)}
          options={clusters}
          getOptionLabel={(cluster) => cluster.id}
          getOptionValue={(cluster) => cluster.id}
          onChange={(cluster) => field.onChange(cluster?.id)}
        />
      )}
    />
  );
}
