"use client";
import {
  Button,
  ColorFormField,
  TextAreaFormField,
  TextFormField,
  TrashIcon,
} from "@quri/ui";
import { FC, PropsWithChildren } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { FormShape } from "./FormShape";
import { SelectCluster } from "./SelectCluster";
import { SelectRecommendedUnit } from "./SelectRecommendedUnit";
import { SlugFormField } from "@/components/ui/SlugFormField";

export const FormSectionHeader: FC<{ headerName: string }> = ({
  headerName,
}) => (
  <div className="text-base font-semibold leading-7 text-gray-900">
    {headerName}
  </div>
);

const FormDivider: FC = () => (
  <div className="border-b border-slate-400 pt-8 mb-6" />
);

const FormSection: FC<PropsWithChildren<{ headerName: string }>> = ({
  headerName,
  children,
}) => {
  return (
    <div>
      <FormSectionHeader headerName={headerName} />
      {children}
    </div>
  );
};

export const HTMLForm: FC = () => {
  const { control } = useFormContext<FormShape>();

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

  return (
    <div>
      <FormSection headerName="Clusters">
        <div className="space-y-3">
          <div className="space-y-2">
            {clusterFields.map((_, i) => (
              <div key={i} className="border-t pb-4 border-slate-200 space-y-2">
                <div className="flex items-end gap-4">
                  <SlugFormField<FormShape>
                    label="ID"
                    placeholder="my_cluster_id"
                    name={`clusters.${i}.id`}
                  />
                  <ColorFormField<FormShape>
                    label="Color"
                    name={`clusters.${i}.color`}
                  />
                </div>
                <SelectRecommendedUnit
                  name={`clusters.${i}.recommendedUnit`}
                  label="Recommended unit"
                />
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
      <FormDivider />
      <FormSection headerName="Items">
        <div className="space-y-4">
          <div>
            {itemFields.map((_, i) => (
              <div
                key={i}
                className="border-b pt-4 pb-6 border-slate-200 space-y-2"
              >
                <SlugFormField<FormShape>
                  label="ID"
                  placeholder="my_item_id"
                  name={`items.${i}.id`}
                />
                <TextFormField<FormShape>
                  label="Name"
                  placeholder="My item name"
                  name={`items.${i}.name`}
                />
                <TextAreaFormField<FormShape>
                  label="Description"
                  placeholder="My item description"
                  name={`items.${i}.description`}
                />
                <SelectCluster
                  label="Cluster ID"
                  name={`items.${i}.clusterId`}
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
                clusterId: null,
              })
            }
          >
            Add item
          </Button>
        </div>
      </FormSection>
      <FormDivider />
      <FormSection headerName="Recommended Unit">
        <SelectRecommendedUnit name="recommendedUnit" />
      </FormSection>
    </div>
  );
};
