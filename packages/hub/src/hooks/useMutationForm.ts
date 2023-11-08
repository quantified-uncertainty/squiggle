import { FieldValues, UseFormProps, useForm } from "react-hook-form";
import { VariablesOf } from "relay-runtime";

import { CommonMutationParameters, useAsyncMutation } from "./useAsyncMutation";
import { useCallback } from "react";

/**
 * This hook ties together `useForm` and `useAsyncMutation`, which is a very common pattern for forms that submit data to our backend through mutations.
 * It forwards some of its parameters to `useForm`, and others to `useAsyncMutation`, and converts form's data to mutation's variables with `formDataToVariables` function.
 *
 * See also:
 * - `<MutationModalAction>` if your form is available through a Dropdown menu
 * - `useAsyncMutation` if your mutation doesn't require a form, and for the details on parameters for this function
 *
 * All generic type parameters to this function default to `never`, so you'll have to set them explicitly to pass type checks.
 */
export function useMutationForm<
  FormShape extends FieldValues = never,
  TMutation extends CommonMutationParameters<TTypename> = never,
  TTypename extends string = never,
  // In some cases, you might want to pass extra data to the mutation, which isn't available in `formDataToVariables`.
  // See `SaveButton` implementation in `EditSquiggleSnippetModel` for an example where it's needed.
  // Longer comment: https://github.com/quantified-uncertainty/squiggle/pull/2498#discussion_r1385665972
  ExtraData extends Record<string, any> = Record<string, never>,
>({
  // useForm params
  defaultValues,
  mode,
  // useAsyncMutation params
  mutation,
  expectedTypename,
  blockOnSuccess,
  confirmation,
  // runMutation params
  onCompleted,
  // bridge from form to runMutation
  formDataToVariables,
}: {
  // This is unfortunately not strictly type-safe: if you return extra variables that are not needed for mutation, TypeScript won't complain.
  // See also: https://stackoverflow.com/questions/72111571/typescript-exact-return-type-of-function
  // This could be solved by converting the return type to generic, but I expect that the lack of partial type parameters in TypeScript
  // would get in the way, so I won't even try.
  formDataToVariables: (
    data: FormShape,
    extraData?: ExtraData
  ) => VariablesOf<TMutation>;
} & Pick<UseFormProps<FormShape>, "defaultValues" | "mode"> &
  Pick<
    Parameters<typeof useAsyncMutation<TMutation, TTypename>>[0],
    // I could just pass everything but I'm worried about potential name collisions, and it's easy to whitelist everything necessary.
    // We have to list all these when we pass them to `useAsyncMutation`, anyway.
    "mutation" | "expectedTypename" | "blockOnSuccess" | "confirmation"
  > &
  // TODO - with `useAsyncMutation`, submitted data is available because `onCompleted` is usually a closure over it.
  // For `useMutationForm`, it'd be useful to pass it to `onCompleted` explicitly, `onCompleted(result, submittedData)`.
  Pick<
    Parameters<ReturnType<typeof useAsyncMutation<TMutation, TTypename>>[0]>[0],
    "onCompleted"
  >) {
  const form = useForm<FormShape>({ defaultValues, mode });

  const [runMutation, inFlight] = useAsyncMutation<TMutation, TTypename>({
    mutation,
    expectedTypename,
    blockOnSuccess,
    confirmation,
  });

  const onSubmit = useCallback(
    (extraData?: ExtraData) =>
      form.handleSubmit((formData) => {
        runMutation({
          variables: formDataToVariables(formData, extraData),
          onCompleted,
        });
      })(),
    [form, formDataToVariables, onCompleted, runMutation]
  );

  return { form, onSubmit, inFlight };
}
