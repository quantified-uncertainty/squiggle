import { BaseSyntheticEvent, useCallback } from "react";
import { FieldValues, useForm, UseFormProps } from "react-hook-form";

import { useToast } from "@quri/ui";

/**
 * This hook ties together `useForm` and server actions.
 *
 * See also:
 * - `<ServerActionModalAction>` if your form is available through a Dropdown menu
 *
 * All generic type parameters to this function default to `never`, so you'll have to set them explicitly to pass type checks.
 */
export function useServerActionForm<
  FormShape extends FieldValues = never,
  const Action extends (input: any) => Promise<any> = never,
  ActionVariables = Parameters<Action>[0],
  ActionResult = Awaited<ReturnType<Action>>,
>({
  defaultValues,
  mode,
  action,
  onCompleted,
  formDataToVariables,
  blockOnSuccess,
}: {
  // This is unfortunately not strictly type-safe: if you return extra variables that are not needed for mutation, TypeScript won't complain.
  // See also: https://stackoverflow.com/questions/72111571/typescript-exact-return-type-of-function
  // This could be solved by converting the return type to generic, but I expect that the lack of partial type parameters in TypeScript
  // would get in the way, so I won't even try.
  formDataToVariables: (data: FormShape) => ActionVariables;
  action: (input: ActionVariables) => Promise<ActionResult>;
  onCompleted?: (result: ActionResult) => void | Promise<void>;
  blockOnSuccess?: boolean;
} & Pick<UseFormProps<FormShape>, "defaultValues" | "mode">) {
  const form = useForm<FormShape>({ defaultValues, mode });

  const toast = useToast();

  const onSubmit = useCallback(
    (event?: BaseSyntheticEvent) =>
      form.handleSubmit(async (formData) => {
        // TODO - transition?
        try {
          const result = await action(formDataToVariables(formData));
          onCompleted?.(result);
        } catch (error) {
          toast(String(error), "error");
          // important to rethrow; otherwise form will have `isSubmitting` set to true, which can make it disabled if `blockOnSuccess` is enabled
          throw error;
        }
      })(event),
    [form, formDataToVariables, onCompleted, action, toast]
  );

  return {
    form,
    onSubmit,
    inFlight: blockOnSuccess
      ? form.formState.isSubmitting || form.formState.isSubmitSuccessful
      : form.formState.isSubmitting,
  };
}
