import { FC, PropsWithChildren, ReactNode } from "react";
import { FieldPath, FieldValues } from "react-hook-form";

import {
  DropdownMenuModalActionItem,
  IconProps,
  useCloseDropdown,
} from "@quri/ui";

import { FormModal } from "@/components/ui/FormModal";
import { useServerActionForm } from "@/lib/hooks/useServerActionForm";

type CommonProps<
  TFormShape extends FieldValues,
  Action extends (input: any) => Promise<any>,
> = Pick<
  Parameters<typeof useServerActionForm<TFormShape, Action>>[0],
  | "formDataToVariables"
  | "defaultValues"
  | "action"
  | "onCompleted"
  | "blockOnSuccess"
> & {
  initialFocus?: FieldPath<TFormShape>;
  submitText: string;
};

function ServerActionFormModal<
  TFormShape extends FieldValues,
  Action extends (input: any) => Promise<any>,
>({
  formDataToVariables,
  initialFocus,
  defaultValues,
  submitText,
  action,
  onCompleted,
  title,
  children,
}: PropsWithChildren<CommonProps<TFormShape, Action>> & {
  title: string;
}): ReactNode {
  // Note that we use the same `close` that's responsible for closing the dropdown.
  const close = useCloseDropdown();

  const { form, onSubmit, inFlight } = useServerActionForm<TFormShape, Action>({
    mode: "onChange",
    defaultValues,
    action,
    formDataToVariables,
    async onCompleted(data) {
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

export function ServerActionModalAction<
  TFormShape extends FieldValues,
  const Action extends (input: any) => Promise<any>,
>({
  modalTitle,
  title,
  icon,
  children,
  ...modalProps
}: CommonProps<TFormShape, Action> & {
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
        <ServerActionFormModal<TFormShape, Action>
          {...modalProps}
          title={modalTitle}
        >
          {children()}
        </ServerActionFormModal>
      )}
    />
  );
}
