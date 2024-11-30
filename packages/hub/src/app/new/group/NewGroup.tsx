"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider } from "react-hook-form";

import { Button } from "@quri/ui";

import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { createGroupAction } from "@/groups/actions/createGroupAction";
import { useServerActionForm } from "@/lib/hooks/useServerActionForm";
import { groupRoute } from "@/lib/routes";

export const NewGroup: FC = () => {
  const router = useRouter();

  type FormShape = {
    slug: string | undefined;
  };

  const { form, onSubmit, inFlight } = useServerActionForm<
    FormShape,
    typeof createGroupAction
  >({
    defaultValues: {},
    mode: "onChange",
    blockOnSuccess: true,
    formDataToVariables: (data) => ({
      slug: data.slug ?? "", // shouldn't happen, but satisfies TypeScript
    }),
    action: createGroupAction,
    onCompleted(result) {
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
          onClick={onSubmit}
          disabled={!form.formState.isValid || inFlight}
          theme="primary"
        >
          Create
        </Button>
      </FormProvider>
    </form>
  );
};
