"use client";

import { FC, useEffect, useState } from "react";
import {
  Control,
  Controller,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  useFieldArray,
  useForm,
} from "react-hook-form";
import Select from "react-select";

import {
  Button,
  ColorInput,
  Labeled,
  StyledTab,
  TextArea,
  TextInput,
  TrashIcon,
} from "@quri/ui";

import { SelectCluster } from "../SelectCluster";

export type RelativeValuesDefinitionFormShape = {
  slug: string;
  title: string;
  items: readonly {
    id: string;
    name: string;
    description: string;
    clusterId: string | null;
  }[];
  clusters: readonly {
    id: string;
    color: string;
    recommendedUnit: string | null;
  }[];
};

const JSONForm: FC<{
  setValue: UseFormSetValue<RelativeValuesDefinitionFormShape>;
  getValues: UseFormGetValues<RelativeValuesDefinitionFormShape>;
}> = ({ setValue, getValues }) => {
  // this is a bit convoluted and would be simpler without react-hook-watch, but <TextArea> component requires RHW
  const { register: jsonRegister, watch: jsonWatch } = useForm<{
    json: string;
  }>({
    defaultValues: async () => ({
      json: JSON.stringify(
        {
          clusters: getValues("clusters"),
          items: getValues("items"),
        },
        null,
        2
      ),
    }),
  });

  useEffect(() => {
    const subscription = jsonWatch((value) => {
      const decoded = JSON.parse(value.json ?? "");
      // FIXME - must be validated first
      setValue("items", decoded.items);
      setValue("clusters", decoded.clusters);
    });
    return () => subscription.unsubscribe();
  }, [jsonWatch, setValue]);

  return <TextArea register={jsonRegister} name="json" />;
};

const HTMLForm: FC<{
  register: UseFormRegister<RelativeValuesDefinitionFormShape>;
  control: Control<RelativeValuesDefinitionFormShape, unknown>;
  watch: UseFormWatch<RelativeValuesDefinitionFormShape>;
}> = ({ register, control, watch }) => {
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

  // for select dropdowns (this affect the form's performance, though)
  const clusters = watch("clusters");
  const items = watch("items");

  return (
    <div>
      <div>
        <header className="font-bold text-lg">Clusters</header>
        <div className="space-y-4">
          <div className="space-y-8">
            {clusterFields.map((_, i) => (
              <div key={i} className="border-t pt-8 border-slate-200 space-y-2">
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
                <Labeled label="Recommended unit">
                  <Controller
                    name={`clusters.${i}.recommendedUnit`}
                    control={control}
                    render={({ field }) => {
                      const value = items.find(
                        (item) => item.id === field.value
                      );
                      return (
                        <Select
                          value={
                            value ? { label: value.id, value: value.id } : null
                          }
                          options={items.map((item) => ({
                            label: item.id,
                            value: item.id,
                          }))}
                          onChange={(item) => field.onChange(item?.value)}
                          isClearable={true}
                        />
                      );
                    }}
                  />
                </Labeled>
                <Button onClick={() => removeCluster(i)}>
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
              appendCluster({ id: "", color: "", recommendedUnit: null })
            }
          >
            Add cluster
          </Button>
        </div>
      </div>
      <div>
        <header className="font-bold text-lg mt-8">Items</header>
        <div className="space-y-4">
          <div className="space-y-8">
            {itemFields.map((_, i) => (
              <div key={i} className="border-t pt-8 border-slate-200 space-y-2">
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
                    clusters={clusters}
                    control={control}
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
      </div>{" "}
    </div>
  );
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
  const { register, handleSubmit, control, watch, setValue, getValues } =
    useForm<RelativeValuesDefinitionFormShape>({ defaultValues });

  const onSubmit = handleSubmit((data) => {
    save(data);
  });

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
      </div>
      <div className="mt-8">
        <StyledTab.Group>
          <StyledTab.List>
            <StyledTab name="Form" icon={() => <div />} />
            <StyledTab name="JSON" icon={() => <div />} />
          </StyledTab.List>
          <div className="mt-8">
            <StyledTab.Panels>
              <StyledTab.Panel>
                <HTMLForm register={register} control={control} watch={watch} />
              </StyledTab.Panel>
              <StyledTab.Panel>
                <JSONForm setValue={setValue} getValues={getValues} />
              </StyledTab.Panel>
            </StyledTab.Panels>
          </div>
        </StyledTab.Group>
      </div>
      <div className="mt-8">
        <Button onClick={onSubmit} theme="primary" wide>
          Save
        </Button>
      </div>
    </form>
  );
};
