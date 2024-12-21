"use client";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const { executeAsync, isPending } = useAction(createModelAction, {
    onSuccess: ({ data }) => {
      if (data) {
        // redirect in action is incompatible with https://github.com/TheEdoRan/next-safe-action/issues/303
        // (and might a bad idea anyway, returning an url is more verbose but more flexible for reuse)
        router.push(data.url);
      }
    },
    onError: ({ error }) => {
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
          type="submit"
          theme="primary"
          disabled={!form.formState.isValid || isPending}
        >
          Create
        </Button>
      </FormProvider>
    </form>
  );
};
