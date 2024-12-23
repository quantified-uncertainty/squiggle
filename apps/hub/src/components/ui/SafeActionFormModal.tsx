import { HookSafeActionFn } from "next-safe-action/hooks";
import { PropsWithChildren, ReactNode } from "react";
import { FieldPath, FieldValues } from "react-hook-form";

import { FormModal } from "@/components/ui/FormModal";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";

export function SafeActionFormModal<
  TFormShape extends FieldValues,
  const Action extends HookSafeActionFn<any, any, any, any, any, any>,
>({
  // action hook props
  formDataToInput,
  defaultValues,
  action,
  onSuccess,
  // modal props
  title,
  initialFocus,
  submitText,
  children,
  close,
  closeOnSuccess = true,
}: Pick<
  Parameters<typeof useSafeActionForm<TFormShape, Action>>[0],
  "formDataToInput" | "defaultValues" | "action" | "onSuccess"
> &
  PropsWithChildren<{
    title: string;
    initialFocus?: FieldPath<TFormShape>;
    submitText: string;
    // Intentionally explicit. In case of forms activated by dropdowns we could obtain this with `useCloseDropdown`, but it's not always the case.
    // The common pattern is to use this component in `DropdownMenuModalActionItem` and pass the close function from `render({ close })`.
    close: () => void;
    // Can be set to false, usually when the `onSuccess` function is used to redirect to a different page.
    // (We want to keep the modal open until the redirect finishes).
    closeOnSuccess?: boolean;
  }>): ReactNode {
  const { form, onSubmit, inFlight } = useSafeActionForm({
    mode: "onChange",
    defaultValues,
    action,
    formDataToInput,
    // always true - modal is useful only once, we don't want to re-enable the submit button even if there's some delay until the modal closes (e.g. because `closeOnSuccess` is false)
    blockOnSuccess: true,
    async onSuccess(data) {
      await onSuccess?.(data);
      if (closeOnSuccess) {
        close();
      }
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
