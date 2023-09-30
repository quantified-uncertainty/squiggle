import { FC, PropsWithChildren, ReactNode } from "react";
import { DefaultValues, FieldPath, FieldValues } from "react-hook-form";
import { GraphQLTaggedNode, VariablesOf } from "relay-runtime";

import { IconProps } from "@quri/ui";

import { FormModal } from "@/components/ui/FormModal";
import { CommonMutationParameters } from "@/hooks/useAsyncMutation";
import { useMutationForm } from "@/hooks/useMutationForm";
import { DropdownMenuModalActionItem } from "@quri/ui";

type CommonProps<
  TMutation extends CommonMutationParameters<TTypename>,
  TFormShape extends FieldValues,
  TTypename extends string,
> = {
  mutation: GraphQLTaggedNode;
  expectedTypename: TTypename;
  formDataToVariables: (data: TFormShape) => VariablesOf<TMutation>;
  initialFocus?: FieldPath<TFormShape>;
  defaultValues?: DefaultValues<TFormShape>;
  submitText: string;
  onCompleted?: (
    data: Extract<TMutation["response"]["result"], { __typename: TTypename }>
  ) => void;
  close: () => void;
};

function MutationFormModal<
  TMutation extends CommonMutationParameters<TTypename>,
  TFormShape extends FieldValues,
  const TTypename extends string,
>({
  mutation,
  expectedTypename,
  formDataToVariables,
  initialFocus,
  defaultValues,
  submitText,
  onCompleted,
  close,
  title,
  children,
}: PropsWithChildren<CommonProps<TMutation, TFormShape, TTypename>> & {
  title: string;
}): ReactNode {
  const { form, onSubmit, inFlight } = useMutationForm<
    TFormShape,
    TMutation,
    TTypename
  >({
    mode: "onChange",
    defaultValues,
    mutation,
    expectedTypename,
    formDataToVariables,
    onCompleted(data) {
      onCompleted?.(data);
      close();
    },
  });

  return (
    <FormModal
      close={close}
      title={title}
      submitText={submitText}
      form={form}
      initialFocus={initialFocus}
      onSubmit={onSubmit}
      inFlight={inFlight}
    >
      {children}
    </FormModal>
  );
}

export function MutationModalAction<
  TMutation extends CommonMutationParameters<TTypename>,
  TFormShape extends FieldValues,
  const TTypename extends string = string,
>({
  modalTitle,
  title,
  icon,
  children,
  ...modalProps
}: CommonProps<TMutation, TFormShape, TTypename> & {
  modalTitle: string;
  title: string;
  icon?: FC<IconProps>;
  children: () => ReactNode;
}): ReactNode {
  return (
    <DropdownMenuModalActionItem
      title={title}
      icon={icon}
      render={() => (
        <MutationFormModal<TMutation, TFormShape, TTypename>
          // Note that we pass the same `close` that's responsible for closing the dropdown.
          {...modalProps}
          title={modalTitle}
        >
          {children()}
        </MutationFormModal>
      )}
    />
  );
}
