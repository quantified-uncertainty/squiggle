import { FC, PropsWithChildren, ReactNode } from "react";
import { FieldPath, FieldValues } from "react-hook-form";

import { DropdownMenuModalActionItem, IconProps } from "@quri/ui";

import { FormModal } from "@/components/ui/FormModal";
import { useServerActionForm } from "@/hooks/useServerActionForm";

type CommonProps<
  TFormShape extends FieldValues,
  ActionVariables,
  ActionResult,
> = Pick<
  Parameters<
    typeof useServerActionForm<TFormShape, ActionVariables, ActionResult>
  >[0],
  | "formDataToVariables"
  | "defaultValues"
  | "action"
  | "onCompleted"
  | "blockOnSuccess"
> & {
  initialFocus?: FieldPath<TFormShape>;
  submitText: string;
  close: () => void;
};

function ServerActionFormModal<
  TFormShape extends FieldValues,
  const ActionVariables,
  const ActionResult,
>({
  formDataToVariables,
  initialFocus,
  defaultValues,
  submitText,
  action,
  onCompleted,
  close,
  title,
  children,
}: PropsWithChildren<CommonProps<TFormShape, ActionVariables, ActionResult>> & {
  title: string;
}): ReactNode {
  const { form, onSubmit, inFlight } = useServerActionForm<
    TFormShape,
    ActionVariables,
    ActionResult
  >({
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
}: CommonProps<
  TFormShape,
  Parameters<Action>[0],
  Awaited<ReturnType<Action>>
> & {
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
        <ServerActionFormModal<
          TFormShape,
          Parameters<Action>[0],
          Awaited<ReturnType<Action>>
        >
          // Note that we pass the same `close` that's responsible for closing the dropdown.
          {...modalProps}
          title={modalTitle}
        >
          {children()}
        </ServerActionFormModal>
      )}
    />
  );
}
