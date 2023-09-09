"use client";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";

import { Button, TextFormField } from "@quri/ui";

import { EditModelExports_Model$key } from "@/__generated__/EditModelExports_Model.graphql";
import { RelativeValuesExportInput } from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import {
  modelForRelativeValuesExportRoute,
  relativeValuesRoute,
} from "@/routes";
import { graphql, useFragment } from "react-relay";
import { SelectOwner } from "../SelectOwner";
import { FormModal } from "../ui/FormModal";
import { H2 } from "../ui/Headers";
import { StyledDefinitionLink } from "../ui/StyledDefinitionLink";
import { StyledLink } from "../ui/StyledLink";
import { SelectRelativeValuesDefinition } from "./SelectRelativeValuesDefinition";

const CreateVariableWithDefinitionModal: FC<{
  close: () => void;
  append: (item: RelativeValuesExportInput) => void;
}> = ({ close, append }) => {
  const form = useForm<RelativeValuesExportInput>();

  const onSubmit = form.handleSubmit((data) => {
    append(data);
    close();
  });

  return (
    <FormModal<RelativeValuesExportInput>
      title="Add relative values export"
      submitText="Create"
      form={form}
      onSubmit={onSubmit}
      close={close}
      initialFocus="variableName"
    >
      <div className="space-y-2">
        <TextFormField
          label="Variable"
          name="variableName"
          rules={{ required: true }}
        />
        <SelectOwner
          label="Relative Values Definition Owner"
          name="definition.owner"
        />
        <SelectRelativeValuesDefinition
          label="Relative Values Definition Slug"
          name="definition.slug"
          ownerFieldName="definition.owner"
        />
      </div>
    </FormModal>
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
          slug
        }
      }
    `,
    modelRef
  );

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm">
        {item.variableName} &rarr;{" "}
        <StyledDefinitionLink
          href={relativeValuesRoute({
            owner: item.definition.owner,
            slug: item.definition.slug,
          })}
        >
          {item.definition.owner}/{item.definition.slug}
        </StyledDefinitionLink>
      </div>
      <StyledLink
        href={modelForRelativeValuesExportRoute({
          owner: model.owner.slug,
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
