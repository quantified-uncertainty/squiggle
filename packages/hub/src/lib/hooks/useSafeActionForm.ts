import {
  InferSafeActionFnInput,
  InferSafeActionFnResult,
} from "next-safe-action";
import { HookSafeActionFn, useAction } from "next-safe-action/hooks";
import { BaseSyntheticEvent, useCallback } from "react";
import { FieldValues, Path, useForm, UseFormProps } from "react-hook-form";

import { useToast } from "@quri/ui";

/**
 * This hook ties together `useForm` and server actions.
 *
 * See also:
 * - `<SafeActionModalAction>` if your form is available through a Dropdown menu
 *
 * All generic type parameters to this function default to `never`, so you'll have to set them explicitly to pass type checks.
 */
export function useSafeActionForm<
  FormShape extends FieldValues = never,
  const Action extends HookSafeActionFn<any, any, any, any, any, any> = never,
  ExtraData extends Record<string, any> = Record<string, never>,
  ActionInput = InferSafeActionFnInput<Action>["clientInput"],
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
  formDataToVariables: (data: FormShape, extraData?: ExtraData) => ActionInput;
  action: Action;
  onCompleted?: (
    result: NonNullable<InferSafeActionFnResult<Action>["data"]>
  ) => void | Promise<void>;
  blockOnSuccess?: boolean;
} & Pick<UseFormProps<FormShape>, "defaultValues" | "mode">) {
  const form = useForm<FormShape>({ defaultValues, mode });

  const toast = useToast();

  // TODO - use https://github.com/next-safe-action/adapter-react-hook-form

  const { executeAsync, isPending, hasSucceeded } = useAction(action, {
    onSuccess: ({ data }) => {
      if (data) {
        onCompleted?.(data);
      }
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast(String(error.serverError), "error");
        return;
      }

      // validation errors?
      if (error.validationErrors) {
        // TODO - support top-level global validation error

        let hasErrors = false;
        for (const [field, fieldErrors] of Object.entries(
          error.validationErrors
        )) {
          if (!fieldErrors || typeof fieldErrors !== "object") {
            continue;
          }

          if ("_errors" in fieldErrors && Array.isArray(fieldErrors._errors)) {
            const fieldError = fieldErrors._errors[0];
            if (fieldError) {
              // TODO - check that the field exists in the form
              form.setError(field as Path<FormShape>, {
                message: String(fieldError),
              });
              hasErrors = true;
            }
          }
        }

        if (hasErrors) {
          return;
        }
      }

      toast("Internal error", "error");
    },
  });

  const onSubmit = useCallback(
    (event?: BaseSyntheticEvent, extraData?: ExtraData) =>
      form.handleSubmit(async (formData) => {
        const result = await executeAsync(
          formDataToVariables(formData, extraData)
        );
        if (result?.serverError || result?.validationErrors) {
          throw new Error("Action failed");
        }
      })(event),
    [form, formDataToVariables, executeAsync]
  );

  return {
    form,
    onSubmit,
    inFlight: blockOnSuccess ? isPending || hasSucceeded : isPending,
  };
}
