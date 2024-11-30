"use client";
import { useAction } from "next-safe-action/hooks";
import { FC, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button, CheckboxFormField, useToast } from "@quri/ui";

import { SelectGroup, SelectGroupOption } from "@/components/SelectGroup";
import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { createModelAction } from "@/models/actions/createModelAction";

type FormShape = {
  slug: string | undefined;
  group: SelectGroupOption | null;
  isPrivate: boolean;
};

export const NewModel: FC<{ initialGroup: SelectGroupOption | null }> = ({
  initialGroup,
}) => {
  const [group] = useState(initialGroup);

  const toast = useToast();

  const { executeAsync, status } = useAction(createModelAction, {
    onError: ({ error, ...rest }) => {
      console.trace("onError", error, rest);
      if (error.serverError) {
        toast(error.serverError, "error");
        return;
      }

      const slugError = error.validationErrors?.slug?._errors?.[0];
      if (slugError) {
        form.setError("slug", {
          message: slugError,
        });
      } else {
        toast("Internal error", "error");
      }
    },
  });

  const form = useForm<FormShape>({
    mode: "onChange",
    defaultValues: {
      // don't pass `slug: ""` here, it will lead to form reset if a user started to type in a value before JS finished loading
      group,
      isPrivate: false,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await executeAsync({
      slug: data.slug ?? "", // shouldn't happen but satisfies Typescript
      groupSlug: data.group?.slug,
      isPrivate: data.isPrivate,
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <FormProvider {...form}>
        <H1>New Model</H1>
        <div className="mb-4 mt-4 space-y-4">
          <SlugFormField<FormShape>
            name="slug"
            example="my-long-model"
            label="Model Name"
            placeholder="my-model"
          />
          <SelectGroup<FormShape>
            label="Group"
            description="Optional. Models owned by a group are editable by all members of the group."
            name="group"
            required={false}
            myOnly={true}
          />
          <CheckboxFormField<FormShape> label="Private" name="isPrivate" />
        </div>
        <Button
          onClick={onSubmit}
          disabled={
            !form.formState.isValid ||
            form.formState.isSubmitting ||
            status === "hasSucceeded"
          }
          theme="primary"
        >
          Create
        </Button>
      </FormProvider>
    </form>
  );
};
