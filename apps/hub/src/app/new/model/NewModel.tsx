"use client";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import { FormProvider } from "react-hook-form";

import { Button, CheckboxFormField } from "@quri/ui";

import { SelectGroup, SelectGroupOption } from "@/components/SelectGroup";
import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";
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

  const router = useRouter();

  const { form, onSubmit, inFlight } = useSafeActionForm<
    FormShape,
    typeof createModelAction
  >({
    mode: "onChange",
    defaultValues: {
      // don't pass `slug: ""` here, it will lead to form reset if a user started to type in a value before JS finished loading
      group,
      isPrivate: false,
    },
    formDataToInput: (data) => ({
      slug: data.slug ?? "", // shouldn't happen but satisfies Typescript
      groupSlug: data.group?.slug,
      isPrivate: data.isPrivate,
    }),
    action: createModelAction,
    blockOnSuccess: true,
    onSuccess: (data) => {
      // Note: redirect in server action would be incompatible with https://github.com/TheEdoRan/next-safe-action/issues/303
      // (and might a bad idea anyway, returning a url is more verbose but more flexible for reuse)
      router.push(data.url);
    },
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
            myOnly
          />
          <CheckboxFormField<FormShape> label="Private" name="isPrivate" />
        </div>
        <Button
          type="submit"
          theme="primary"
          disabled={!form.formState.isValid || inFlight}
        >
          Create
        </Button>
      </FormProvider>
    </form>
  );
};
