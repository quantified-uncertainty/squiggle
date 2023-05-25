"use client";

import { FC } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { Button, ColorInput, TextArea, TextInput } from "@quri/ui";

export type RelativeValuesDefinitionFormShape = {
  slug?: string;
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
  const { register, handleSubmit, control } =
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

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-2">
        {withoutSlug ? null : (
          <TextInput register={register} name="slug" label="Slug" />
        )}
        <TextInput register={register} name="title" label="Title" />
        <div>
          <header className="font-bold text-lg mt-8">Clusters</header>
          <div className="space-y-2">
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
                      name={`clusters.${i}.id`}
                    />
                    <ColorInput
                      register={register}
                      label="Color"
                      name={`clusters.${i}.color`}
                    />
                  </div>
                  <Button onClick={() => removeCluster(i)}>Remove</Button>
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
          <div className="space-y-2">
            <div className="space-y-8">
              {itemFields.map((_, i) => (
                <div
                  key={i}
                  className="border-t pt-8 border-slate-200 space-y-2"
                >
                  <TextInput
                    register={register}
                    label="ID"
                    name={`items.${i}.id`}
                  />
                  <TextInput
                    register={register}
                    label="Name"
                    name={`items.${i}.name`}
                  />
                  <TextArea
                    register={register}
                    label="Description"
                    name={`items.${i}.description`}
                  />
                  <TextInput
                    register={register}
                    label="Cluster ID"
                    name={`items.${i}.clusterId`}
                  />
                  <Button onClick={() => removeItem(i)}>Remove</Button>
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
