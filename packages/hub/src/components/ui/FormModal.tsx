import { Button, Modal } from "@quri/ui";
import { PropsWithChildren } from "react";
import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";

type Props<TFieldValues extends FieldValues> = PropsWithChildren<{
  onSubmit: () => void;
  close: () => void;
  submitText: string;
  title: string;
  inFlight?: boolean;
  form: UseFormReturn<TFieldValues, any, undefined>;
}>;

// Common Modal component for forms.
export function FormModal<TFieldValues extends FieldValues>({
  onSubmit,
  close,
  submitText,
  title,
  inFlight,
  form,
  children,
}: Props<TFieldValues>) {
  return (
    <Modal close={close}>
      <form onSubmit={onSubmit}>
        <FormProvider {...form}>
          <Modal.Header>{title}</Modal.Header>
          <Modal.Body>{children}</Modal.Body>
          <Modal.Footer>
            <Button
              onClick={onSubmit}
              theme="primary"
              disabled={!form.formState.isValid || inFlight}
            >
              {submitText}
            </Button>
          </Modal.Footer>
        </FormProvider>
      </form>
    </Modal>
  );
}
