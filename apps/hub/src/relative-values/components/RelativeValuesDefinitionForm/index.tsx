import {
  InferSafeActionFnInput,
  InferSafeActionFnResult,
} from "next-safe-action";
import { HookSafeActionFn } from "next-safe-action/hooks";
import { FormProvider } from "react-hook-form";

import { Button, StyledTab, TextFormField } from "@quri/ui";

import { SlugFormField } from "@/components/ui/SlugFormField";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";

import { FormShape } from "./FormShape";
import { FormSectionHeader, HTMLForm } from "./HTMLForm";
import { JSONForm } from "./JSONForm";

type Props = {
  defaultValues?: FormShape;
  withoutSlug?: boolean;
  save: (data: FormShape) => Promise<void>;
};

export function RelativeValuesDefinitionForm<
  Action extends HookSafeActionFn<any, any, any, any, any, any>,
>({
  defaultValues,
  withoutSlug,
  action,
  formDataToInput,
  onSuccess,
}: {
  defaultValues?: FormShape;
  withoutSlug?: boolean;
  action: Action;
  formDataToInput: (
    data: FormShape
  ) => InferSafeActionFnInput<Action>["clientInput"];
  onSuccess?: (
    data: NonNullable<InferSafeActionFnResult<Action>["data"]>
  ) => void;
}) {
  const { form, onSubmit, inFlight } = useSafeActionForm({
    mode: "onChange",
    defaultValues,
    action,
    formDataToInput,
    onSuccess,
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
          <Button type="submit" theme="primary" disabled={inFlight}>
            Save
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
