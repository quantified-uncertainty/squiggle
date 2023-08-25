"use client";

import { ChangeEventHandler, FC, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import Select from "react-select";

import {
  Button,
  ColorFormField,
  ControlledFormField,
  StyledTab,
  StyledTextArea,
  TextAreaFormField,
  TextFormField,
  TrashIcon,
} from "@quri/ui";

import { SelectCluster } from "../SelectCluster";

const formSectionHeader = (text: string) => (
  <div className="text-base font-semibold leading-7 text-gray-900">{text}</div>
);

const formDivider = <div className="border-b border-slate-400 pt-8 mb-6" />;

function FormSection({
  headerName,
  children,
}: {
  headerName: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {formSectionHeader(headerName)}
      {children}
    </div>
  );
}

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
  recommendedUnit: string | null;
};

const JSONForm: FC = () => {
  const { setValue, getValues } =
    useFormContext<RelativeValuesDefinitionFormShape>();

  const [defaultValue] = useState(() =>
    JSON.stringify(
      {
        clusters: getValues("clusters"),
        items: getValues("items"),
        recommendedUnit: getValues("recommendedUnit"),
      },
      null,
      2
    )
  );

  const onChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const decoded = JSON.parse(e.target.value ?? "");
    // FIXME - must be validated first
    setValue("items", decoded.items);
    setValue("clusters", decoded.clusters);
    setValue("recommendedUnit", decoded.recommendedUnit);
  };

  return (
    <StyledTextArea
      defaultValue={defaultValue}
      onChange={onChange}
      name="json"
    />
  );
};

const HTMLForm: FC = () => {
  const { control, watch } =
    useFormContext<RelativeValuesDefinitionFormShape>();

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

  // for select dropdowns (this affects the form's performance, though)
  const clusters = watch("clusters") ?? [];
  const items = watch("items") ?? [];

  return (
    <div>
      <FormSection headerName="Clusters">
        <div className="space-y-3">
          <div className="space-y-2">
            {clusterFields.map((_, i) => (
              <div key={i} className="border-t pb-4 border-slate-200 space-y-2">
                <div className="flex items-end gap-4">
                  <TextFormField
                    label="ID"
                    placeholder="my_cluster_id"
                    name={`clusters.${i}.id`}
                  />
                  <ColorFormField label="Color" name={`clusters.${i}.color`} />
                </div>
                <ControlledFormField
                  name={`clusters.${i}.recommendedUnit`}
                  label="Recommended unit"
                >
                  {(field) => {
                    const value = items.find((item) => item.id === field.value);
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
                </ControlledFormField>
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
      </FormSection>
      {formDivider}
      <FormSection headerName="Items">
        <div className="space-y-4">
          <div>
            {itemFields.map((_, i) => (
              <div
                key={i}
                className="border-b pt-4 pb-6 border-slate-200 space-y-2"
              >
                <TextFormField
                  label="ID"
                  placeholder="my_item_id"
                  name={`items.${i}.id`}
                />
                <TextFormField
                  label="Name"
                  placeholder="My item name"
                  name={`items.${i}.name`}
                />
                <TextAreaFormField
                  label="Description"
                  placeholder="My item description"
                  name={`items.${i}.description`}
                />

                <SelectCluster
                  label="Cluster ID"
                  name={`items.${i}.clusterId`}
                  clusters={clusters}
                />
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
      </FormSection>
      {formDivider}
      <FormSection headerName="Recommended Unit">
        <Controller
          name="recommendedUnit"
          control={control}
          render={({ field }) => {
            const value = items.find((item) => item.id === field.value);
            return (
              <Select
                value={value ? { label: value.id, value: value.id } : null}
                options={items.map((item) => ({
                  label: item.id,
                  value: item.id,
                }))}
                onChange={(item) => field.onChange(item?.value ?? null)}
                isClearable={true}
              />
            );
          }}
        />
      </FormSection>
    </div>
  );
};

type Props = {
  defaultValues?: RelativeValuesDefinitionFormShape;
  withoutSlug?: boolean;
  save: (data: RelativeValuesDefinitionFormShape) => Promise<void>;
};

export const RelativeValuesDefinitionForm: FC<Props> = ({
  defaultValues,
  withoutSlug,
  save,
}) => {
  const form = useForm<RelativeValuesDefinitionFormShape>({ defaultValues });

  const onSubmit = form.handleSubmit(async (data) => {
    await save(data);
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <div className="space-y-2">
          {withoutSlug ? null : (
            <TextFormField
              name="slug"
              label="Slug"
              placeholder="my_definition"
            />
          )}
          <TextFormField
            name="title"
            label="Title"
            placeholder="My definition"
          />
        </div>
        <div className="pt-8">
          {formSectionHeader("Editing Format")}
          <StyledTab.Group>
            <StyledTab.List>
              <StyledTab name="Form" />
              <StyledTab name="JSON" />
            </StyledTab.List>
            <div className="mt-4">
              <StyledTab.Panels>
                <StyledTab.Panel>
                  <HTMLForm />
                </StyledTab.Panel>
                <StyledTab.Panel>
                  <JSONForm />
                </StyledTab.Panel>
              </StyledTab.Panels>
            </div>
          </StyledTab.Group>
        </div>
        <div className="mt-4">
          <Button onClick={onSubmit} theme="primary">
            Save
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
