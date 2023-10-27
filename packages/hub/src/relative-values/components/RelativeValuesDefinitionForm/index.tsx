"use client";

import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from 'react-toastify';

import { Button, TextFormField } from "@quri/ui";

import { SlugFormField } from "@/components/ui/SlugFormField";
import { updateRelativeValuesDefinition } from "@/graphql/mutations";
import { FormShape } from "./FormShape";

// Removed exportData function as it was not performing any operations on the data
import { FormSectionHeader, HTMLForm } from "./HTMLForm";

type Props = {
  defaultValues?: FormShape;
  withoutSlug?: boolean;
  save: (data: FormShape) => Promise<void>;
};

export const RelativeValuesDefinitionForm: FC<Props> = ({
  defaultValues,
  withoutSlug,
  save,
}) => {
  const form = useForm<FormShape>({ defaultValues });

  const onSubmit = form.handleSubmit(async (data) => {
      // Save operation
      try {
        await save(data);
        await updateRelativeValuesDefinition(data);
      } catch (error) {
        // Handle error
        toast.error("Failed to save data: " + error.message);
      }
    });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <div className="space-y-2">
          {withoutSlug ? null : (
            <SlugFormField<FormShape>
              name="slug"
              label="Slug"
              placeholder="my_definition"
            />
          )}
          <TextFormField<FormShape>
            name="title"
            label="Title"
            placeholder="My definition"
          />
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
// Function to display error message
const displayError = (message: string) => {
  // Display a toast notification with the error message
  toast.error(message);
};
