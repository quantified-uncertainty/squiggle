"use client";
import { FC, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button, Modal, TextFormField } from "@quri/ui";

import { EditModelExports_Model$key } from "@/__generated__/EditModelExports_Model.graphql";
import { RelativeValuesExportInput } from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import {
  relativeValuesRoute,
  modelForRelativeValuesExportRoute,
} from "@/routes";
import { graphql, useFragment } from "react-relay";
import { SelectUser } from "../SelectUser";
import { H2 } from "../ui/Headers";
import { StyledDefinitionLink } from "../ui/StyledDefinitionLink";
import { StyledLink } from "../ui/StyledLink";
import { SelectRelativeValuesDefinition } from "./SelectRelativeValuesDefinition";
import { useOwner } from "@/hooks/Owner";

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

const ExportItem: FC<{
  item: RelativeValuesExportInput;
  modelRef: EditModelExports_Model$key;
  remove: () => void;
}> = ({ item, modelRef, remove }) => {
  const model = useFragment(
    graphql`
      fragment EditModelExports_Model on Model {
        id
        slug
        owner {
          ...Owner
        }
      }
    `,
    modelRef
  );
  const owner = useOwner(model.owner);

  return (
    <div className="flex items-center gap-2">
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
          owner,
          slug: model.slug,
          variableName: item.variableName,
        })}
      >
        View
      </StyledLink>
      <Button onClick={remove} size="small">
        Delete
      </Button>
    </div>
  );
};

type Props = {
  append: (item: RelativeValuesExportInput) => void;
  remove: (id: number) => void;
  items: RelativeValuesExportInput[];
  modelRef: EditModelExports_Model$key;
};

export const EditModelExports: FC<Props> = ({
  append,
  remove,
  items,
  modelRef,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <H2>Relative Values Exports</H2>
      <div>
        {items.map((item, i) => (
          <ExportItem
            key={i}
            item={item}
            modelRef={modelRef}
            remove={() => remove(i)}
          />
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
