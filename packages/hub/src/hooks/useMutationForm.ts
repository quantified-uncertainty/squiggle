import { FieldValues, UseFormProps, useForm } from "react-hook-form";
import { GraphQLTaggedNode, VariablesOf } from "relay-runtime";

import { CommonMutationParameters, useAsyncMutation } from "./useAsyncMutation";

export function useMutationForm<
  FormShape extends FieldValues = never,
  TMutation extends CommonMutationParameters<TTypename> = never,
  TTypename extends string = never,
>({
  mutation,
  expectedTypename,
  formDataToVariables,
  defaultValues,
  onCompleted,
}: {
  mutation: GraphQLTaggedNode;
  expectedTypename: TTypename;
  // This is unfortunately not strictly type-safe: if you return extra variables that are not needed for mutation, TypeScript won't complain.
  // See also: https://stackoverflow.com/questions/72111571/typescript-exact-return-type-of-function
  // This could be solved by converting the return type to generic, but I expect that the lack of partial type parameters in TypeScript
  // would get in the way, so I won't even try.
  formDataToVariables: (data: FormShape) => VariablesOf<TMutation>;
  onCompleted?: (
    // OkResult, see also: useAsyncMutation
    result: Extract<TMutation["response"]["result"], { __typename: TTypename }>
  ) => void;
} & Pick<UseFormProps<FormShape>, "defaultValues">) {
  const form = useForm<FormShape>({ defaultValues });

  const [runMutation, inFlight] = useAsyncMutation<TMutation, TTypename>({
    mutation,
    expectedTypename,
  });

  const onSubmit = form.handleSubmit((formData) => {
    runMutation({
      variables: formDataToVariables(formData),
      onCompleted,
    });
  });

  return { form, onSubmit, inFlight };
}
