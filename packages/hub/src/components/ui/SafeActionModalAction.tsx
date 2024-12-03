import { HookSafeActionFn } from "next-safe-action/hooks";
import { FC, PropsWithChildren, ReactNode } from "react";
import { FieldPath, FieldValues } from "react-hook-form";

import {
  DropdownMenuModalActionItem,
  IconProps,
  useCloseDropdown,
} from "@quri/ui";

import { FormModal } from "@/components/ui/FormModal";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";

type CommonProps<
  TFormShape extends FieldValues,
  Action extends HookSafeActionFn<any, any, any, any, any, any>,
> = Pick<
  Parameters<typeof useSafeActionForm<TFormShape, Action>>[0],
  | "formDataToInput"
  | "defaultValues"
  | "action"
  | "onSuccess"
  | "blockOnSuccess"
> & {
  initialFocus?: FieldPath<TFormShape>;
  submitText: string;
};

function SafeActionFormModal<
  TFormShape extends FieldValues,
  const Action extends HookSafeActionFn<any, any, any, any, any, any>,
>({
  formDataToInput,
  initialFocus,
  defaultValues,
  submitText,
  action,
  onSuccess,
  title,
  children,
}: PropsWithChildren<CommonProps<TFormShape, Action>> & {
  title: string;
}): ReactNode {
  // Note that we use the same `close` that's responsible for closing the dropdown.
  const closeDropdown = useCloseDropdown();

  const { form, onSubmit, inFlight } = useSafeActionForm({
    mode: "onChange",
    defaultValues,
    action,
    formDataToInput,
    async onSuccess(data) {
      onSuccess?.(data);
      closeDropdown();
    },
  });

  return (
    <FormModal
      close={closeDropdown}
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

export function SafeActionModalAction<
  TFormShape extends FieldValues,
  const Action extends HookSafeActionFn<any, any, any, any, any, any>,
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
        <SafeActionFormModal<TFormShape, Action>
          {...modalProps}
          title={modalTitle}
        >
          {children()}
        </SafeActionFormModal>
      )}
    />
  );
}
