"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button } from "@quri/ui";

import { SlugFormField } from "@/components/ui/SlugFormField";
import { setUsername } from "@/users/actions";

export const ChooseUsername: FC = () => {
  const router = useRouter();

  type FormShape = {
    username: string;
  };

  const form = useForm<FormShape>();

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await setUsername(data);
    if (result.ok) {
      router.replace("/");
    } else {
      form.setError("username", { message: result.error });
    }
  });

  const disabled =
    form.formState.isSubmitting ||
    form.formState.isSubmitSuccessful ||
    !form.formState.isValid;

  return (
    <form onSubmit={onSubmit}>
      <FormProvider {...form}>
        <div className="mt-20 flex flex-col items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <SlugFormField<FormShape>
                placeholder="Username"
                name="username"
                label="Pick a username"
                size="small"
              />
              <Button onClick={onSubmit} disabled={disabled} theme="primary">
                Save
              </Button>
            </div>
          </div>
        </div>
      </FormProvider>
    </form>
  );
};
