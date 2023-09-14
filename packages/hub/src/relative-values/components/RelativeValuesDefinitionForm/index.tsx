"use client";

import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button, StyledTab, TextFormField } from "@quri/ui";

import { SlugFormField } from "@/components/ui/SlugFormField";
import { JSONForm } from "./JSONForm";
import { FormShape } from "./FormShape";
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
    await save(data);
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
        <div className="pt-8">
          <FormSectionHeader headerName="Editing Format" />
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
