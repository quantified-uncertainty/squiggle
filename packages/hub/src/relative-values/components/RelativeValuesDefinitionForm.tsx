"use client";

import { FC } from "react";
import {
  Control,
  Controller,
  Path,
  useFieldArray,
  useForm,
} from "react-hook-form";
import Select from "react-select";

import {
  Button,
  ColorInput,
  Labeled,
  TextArea,
  TextInput,
  TrashIcon,
} from "@quri/ui";

const SelectCluster: FC<{
  clusters: RelativeValuesDefinitionFormShape["clusters"];
  name: Path<RelativeValuesDefinitionFormShape>;
  control: Control<RelativeValuesDefinitionFormShape>;
}> = ({ clusters, name, control }) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          value={clusters.find((cluster) => cluster.id === field.value)}
          options={clusters}
          getOptionLabel={(cluster) => cluster.id}
          getOptionValue={(cluster) => cluster.id}
          onChange={(cluster) => field.onChange(cluster?.id)}
        />
      )}
    />
  );
};

export type RelativeValuesDefinitionFormShape = {
  slug: string;
  title: string;
  items: readonly {
    id: string;
    name: string;
    description: string;
    clusterId: string | null;
  }[];
  clusters: readonly { id: string; color: string }[];
};

type Props = {
  defaultValues?: RelativeValuesDefinitionFormShape;
  withoutSlug?: boolean;
  save: (data: RelativeValuesDefinitionFormShape) => void;
};

export const RelativeValuesDefinitionForm: FC<Props> = ({
  defaultValues,
  withoutSlug,
  save,
}) => {
  const { register, handleSubmit, control, watch } =
    useForm<RelativeValuesDefinitionFormShape>({
      defaultValues,
    });

  const {
    fields: clusterFields,
    append: appendCluster,
    remove: removeCluster,
  } = useFieldArray({
    name: "clusters",
    control,
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    name: "items",
    control,
  });

  const onSubmit = handleSubmit((data) => {
    save(data);
  });

  // for cluster selects
  const clusters = watch("clusters");

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-2">
        {withoutSlug ? null : (
          <TextInput
            register={register}
            name="slug"
            label="Slug"
            placeholder="my_definition"
          />
        )}
        <TextInput
          register={register}
          name="title"
          label="Title"
          placeholder="My definition"
        />
        <div>
          <header className="font-bold text-lg mt-8">Clusters</header>
          <div className="space-y-4">
            <div className="space-y-8">
              {clusterFields.map((_, i) => (
                <div
                  key={i}
                  className="border-t pt-8 border-slate-200 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <TextInput
                      register={register}
                      label="ID"
                      placeholder="my_cluster_id"
                      name={`clusters.${i}.id`}
                    />
                    <ColorInput
                      control={control}
                      label="Color"
                      name={`clusters.${i}.color`}
                    />
                  </div>
                  <Button onClick={() => removeCluster(i)}>
                    <div className="flex gap-1">
                      <TrashIcon />
                      <span>Remove</span>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
            <Button onClick={() => appendCluster({ id: "", color: "" })}>
              Add cluster
            </Button>
          </div>
        </div>
        <div>
          <header className="font-bold text-lg mt-8">Items</header>
          <div className="space-y-4">
            <div className="space-y-8">
              {itemFields.map((_, i) => (
                <div
                  key={i}
                  className="border-t pt-8 border-slate-200 space-y-2"
                >
                  <TextInput
                    register={register}
                    label="ID"
                    placeholder="my_item_id"
                    name={`items.${i}.id`}
                  />
                  <TextInput
                    register={register}
                    label="Name"
                    placeholder="My item name"
                    name={`items.${i}.name`}
                  />
                  <TextArea
                    register={register}
                    label="Description"
                    placeholder="My item description"
                    name={`items.${i}.description`}
                  />

                  <Labeled label="Cluster ID">
                    <SelectCluster
                      name={`items.${i}.clusterId`}
                      control={control}
                      clusters={clusters}
                    />
                  </Labeled>
                  <Button onClick={() => removeItem(i)}>
                    <div className="flex gap-1">
                      <TrashIcon />
                      <span>Remove</span>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
            <Button
              onClick={() =>
                appendItem({
                  id: "",
                  name: "",
                  description: "",
                  clusterId: "",
                })
              }
            >
              Add item
            </Button>
          </div>
          <div className="mt-4">
            <Button onClick={onSubmit} theme="primary" wide>
              Save
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
