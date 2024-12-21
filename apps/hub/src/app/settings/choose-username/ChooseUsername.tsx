"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider } from "react-hook-form";

import { Button } from "@quri/ui";

import { SlugFormField } from "@/components/ui/SlugFormField";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";
import { setUsernameAction } from "@/users/actions/setUsernameAction";

export const ChooseUsername: FC = () => {
  const router = useRouter();

  type FormShape = {
    username: string;
  };

  const { form, onSubmit, inFlight } = useSafeActionForm<
    FormShape,
    typeof setUsernameAction
  >({
    action: setUsernameAction,
    onSuccess: () => {
      // this is enough - `page.tsx` will notice that the username is set now, and redirect to the home page
      router.refresh();
    },
    formDataToInput: (data) => ({ username: data.username }),
    blockOnSuccess: true,
  });

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
              <Button type="submit" theme="primary" disabled={inFlight}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </FormProvider>
    </form>
  );
};
