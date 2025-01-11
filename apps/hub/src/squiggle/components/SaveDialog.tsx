"use client";
import { FC } from "react";
import { useForm } from "react-hook-form";

import { TextAreaFormField } from "@quri/ui";

import { FormModal } from "@/components/ui/FormModal";

import { OnSubmit } from "./EditSquiggleSnippetModel";

export const SaveDialog: FC<{ onSubmit: OnSubmit; close: () => void }> = ({
  onSubmit,
  close,
}) => {
  type SaveFormShape = {
    comment: string;
  };
  const form = useForm<SaveFormShape>();

  const handleSubmit = form.handleSubmit(async ({ comment }, event) => {
    await onSubmit(event, { comment });
    close();
  });

  return (
    <FormModal
      onSubmit={handleSubmit}
      title="Save with comment"
      form={form}
      close={close}
      inFlight={form.formState.isSubmitting}
      initialFocus="comment"
      submitText="Save"
    >
      <TextAreaFormField<SaveFormShape> name="comment" label="Comment" />
    </FormModal>
  );
};
