import { FC, useState } from "react";
import { useForm } from "react-hook-form";

import { Button, TextFormField } from "@quri/ui";

import {
  modelForRelativeValuesExportRoute,
  relativeValuesRoute,
} from "@/lib/routes";
import { ModelFullDTO } from "@/models/data/full";
import { OwnerDTO } from "@/owners/data/owner";
import { RelativeValuesForSelectDTO } from "@/relative-values/data/findRelativeValuesForSelect";
import { RelativeValuesExportInput } from "@/squiggle/components/EditSquiggleSnippetModel";

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
  type FormShape = {
    variableName: string;
    owner: OwnerDTO | null;
    definition: RelativeValuesForSelectDTO | null;
  };

  type ValidatedFormShape = {
    // all fields are rquired
    [k in keyof FormShape]: NonNullable<FormShape[k]>;
  };

  const form = useForm<FormShape, unknown, ValidatedFormShape>({
    // this is necessary for resetField in SelectRelativeValuesDefinition to work correctly
    defaultValues: {
      variableName: "",
      owner: null,
      definition: null,
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    append({
      variableName: data.variableName,
      definition: {
        owner: data.owner.slug,
        slug: data.definition.slug,
      },
    });
    close();
  });

  return (
    <FormModal<FormShape>
      title="Add relative values export"
      submitText="Create"
      form={form}
      onSubmit={onSubmit}
      close={close}
      initialFocus="variableName"
    >
      <div className="space-y-2">
        <TextFormField<FormShape>
          label="Variable"
          name="variableName"
          rules={{ required: true }}
        />
        <SelectOwner<FormShape>
          label="Relative Values Definition Owner"
          name="owner"
          myOnly={false}
        />
        <SelectRelativeValuesDefinition<FormShape>
          label="Relative Values Definition Slug"
          name="definition"
          ownerFieldName="owner"
        />
      </div>
    </FormModal>
  );
};

const ExportItem: FC<{
  item: RelativeValuesExportInput;
  model: ModelFullDTO;
  remove: () => void;
}> = ({ item, model, remove }) => {
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
  model: ModelFullDTO;
};

export const EditRelativeValueExports: FC<Props> = ({
  append,
  remove,
  items,
  model,
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
            model={model}
            remove={() => remove(i)}
          />
        ))}
      </div>
      <div className="mt-2">
        <Button onClick={() => setIsOpen(true)} theme="primary">
          Export New Relative Value Variable
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
