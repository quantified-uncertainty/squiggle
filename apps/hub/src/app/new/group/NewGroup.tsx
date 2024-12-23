"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider } from "react-hook-form";

import { Button } from "@quri/ui";

import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { createGroupAction } from "@/groups/actions/createGroupAction";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";
import { groupRoute } from "@/lib/routes";

export const NewGroup: FC = () => {
  const router = useRouter();

  type FormShape = {
    slug: string | undefined;
  };

  const { form, onSubmit, inFlight } = useSafeActionForm<
    FormShape,
    typeof createGroupAction
  >({
    defaultValues: {},
    mode: "onChange",
    blockOnSuccess: true,
    formDataToInput: (data) => ({
      slug: data.slug ?? "", // shouldn't happen, but satisfies TypeScript
    }),
    action: createGroupAction,
    onSuccess(result) {
      router.push(groupRoute({ slug: result.slug }));
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <FormProvider {...form}>
        <H1>New Group</H1>
        <div className="mb-4">
          <SlugFormField<FormShape>
            name="slug"
            example="abc-project"
            label="Group Name"
            placeholder="my-group"
          />
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
