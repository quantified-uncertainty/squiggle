"use client";

import { FC, useState } from "react";

import { Button, Modal, TextInput } from "@quri/ui";
import { RelativeValuesExportInput } from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import { useForm } from "react-hook-form";
import { StyledDefinitionLink } from "../ui/StyledDefinitionLink";
import { relativeValuesRoute } from "@/routes";

const CreateVariableWithDefinitionModal: FC<{
  close: () => void;
  append: (item: RelativeValuesExportInput) => void;
}> = ({ close, append }) => {
  const { register, handleSubmit } = useForm<RelativeValuesExportInput>();

  const create = handleSubmit((data) => {
    append(data);
    close();
  });

  return (
    <Modal close={close}>
      <Modal.Header>Add relative values export</Modal.Header>
      <Modal.Body>
        <div className="space-y-2">
          <TextInput register={register} label="Variable" name="variableName" />
          <TextInput
            register={register}
            label="Username"
            name="definition.username"
          />
          <TextInput register={register} label="Slug" name="definition.slug" />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={create} theme="primary">
          Create
        </Button>
      </Modal.Footer>
    </Modal>
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
            <Button onClick={() => remove(i)}>Remove</Button>
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
