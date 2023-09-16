import { FC, PropsWithChildren, ReactNode, useEffect, useState } from "react";
import {
  DefaultValues,
  FieldPath,
  FieldValues,
  useForm,
} from "react-hook-form";
import { GraphQLTaggedNode, VariablesOf } from "relay-runtime";

import { DropdownMenuActionItem, EditIcon, IconProps } from "@quri/ui";

import { FormModal } from "@/components/ui/FormModal";
import {
  CommonMutationParameters,
  useAsyncMutation,
} from "@/hooks/useAsyncMutation";

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
  const form = useForm<TFormShape>({
    mode: "onChange",
    defaultValues,
  });
  const [runMutation, inFlight] = useAsyncMutation<TMutation, TTypename>({
    mutation,
    expectedTypename,
  });

  const save = form.handleSubmit((data) => {
    runMutation({
      variables: formDataToVariables(data),
      onCompleted(data) {
        onCompleted?.(data);
        close();
      },
    });
  });

  return (
    <FormModal
      close={close}
      title={title}
      submitText={submitText}
      form={form}
      initialFocus={initialFocus}
      onSubmit={save}
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <DropdownMenuActionItem
        title={title}
        onClick={() => setIsOpen(true)}
        icon={icon}
      />
      {isOpen && (
        <MutationFormModal<TMutation, TFormShape, TTypename>
          // Note that we pass the same `close` that's responsible for closing the dropdown.
          // There's no need to call setIsOpen(false); closing the dropdown is enough, since this component will be destroyed.
          {...modalProps}
          title={modalTitle}
        >
          {children()}
        </MutationFormModal>
      )}
    </>
  );
}
