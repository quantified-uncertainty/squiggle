"use client";
import { FC, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button, Modal, TextFormField, TrashIcon } from "@quri/ui";

import { RelativeValuesExportInput } from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import {
  relativeValuesRoute,
  modelForRelativeValuesExportRoute,
  modelViewRoute,
} from "@/routes";
import { StyledDefinitionLink } from "../ui/StyledDefinitionLink";
import { SelectUser } from "../SelectUser";
import { SelectRelativeValuesDefinition } from "./SelectRelativeValuesDefinition";
import { StyledLink } from "../ui/StyledLink";
import { H2 } from "../ui/Headers";

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
            <SelectUser label="Username" name="definition.username" />
            <SelectRelativeValuesDefinition
              label="Slug"
              name="definition.slug"
              userFieldName="definition.username"
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
  modelSlug: string;
};

export const EditModelExports: FC<Props> = ({
  append,
  remove,
  items,
  modelSlug,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <H2>Relative Values Exports</H2>
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
            <StyledLink
              href={modelForRelativeValuesExportRoute({
                username: item.definition.username,
                slug: modelSlug,
                variableName: item.variableName,
              })}
            >
              View
            </StyledLink>
            <Button onClick={() => remove(i)} size="small">
              Delete
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-2">
        <Button onClick={() => setIsOpen(true)} theme="primary">
          Export New Variable
        </Button>
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
