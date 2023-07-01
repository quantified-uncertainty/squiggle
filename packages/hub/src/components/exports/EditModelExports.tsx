"use client";

import { FC, useState } from "react";

import { RelativeValuesExportInput } from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import { relativeValuesRoute } from "@/routes";
import { Button, Modal, TextFormField, TrashIcon } from "@quri/ui";
import { FormProvider, useForm } from "react-hook-form";
import { StyledDefinitionLink } from "../ui/StyledDefinitionLink";

const CreateVariableWithDefinitionModal: FC<{
  close: () => void;
  append: (item: RelativeValuesExportInput) => void;
}> = ({ close, append }) => {
  const form = useForm<RelativeValuesExportInput>();

  const create = form.handleSubmit((data) => {
    append(data);
    close();
  });

  return (
    <FormProvider {...form}>
      <Modal close={close}>
        <Modal.Header>Add relative values export</Modal.Header>
        <Modal.Body>
          <div className="space-y-2">
            <TextFormField
              label="Variable"
              name="variableName"
              rules={{ required: true }}
            />
            <TextFormField
              label="Username"
              name="definition.username"
              rules={{ required: true }}
            />
            <TextFormField
              label="Slug"
              name="definition.slug"
              rules={{ required: true }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={create} theme="primary">
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </FormProvider>
  );
};

type Props = {
  append: (item: RelativeValuesExportInput) => void;
  remove: (id: number) => void;
  items: RelativeValuesExportInput[];
};

export const EditModelExports: FC<Props> = ({ append, remove, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="text-sm">
              {item.variableName} &rarr;{" "}
              <StyledDefinitionLink
                href={relativeValuesRoute({
                  username: item.definition.username,
                  slug: item.definition.slug,
                })}
              >
                {item.definition.username}/{item.definition.slug}
              </StyledDefinitionLink>
            </div>
            <TrashIcon
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
              onClick={() => remove(i)}
            />
          </div>
        ))}
      </div>
      <div className="mt-2">
        <Button onClick={() => setIsOpen(true)}>Add view</Button>
      </div>
      {isOpen && (
        <CreateVariableWithDefinitionModal
          close={() => setIsOpen(false)}
          append={append}
        />
      )}
    </div>
  );
};
