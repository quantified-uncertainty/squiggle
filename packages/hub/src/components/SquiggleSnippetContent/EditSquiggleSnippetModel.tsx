import { useSession } from "next-auth/react";
import { FC, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { graphql, useFragment, useMutation } from "react-relay";

import { SquigglePlayground } from "@quri/squiggle-components";
import { Button, Modal, TextArea, TextInput, useToast } from "@quri/ui";

import { EditSquiggleSnippetModelMutation } from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import { ModelPageBody$key } from "@/__generated__/ModelPageBody.graphql";
import { SquiggleSnippetContent$key } from "@/__generated__/SquiggleSnippetContent.graphql";
import { VariablesWithDefinitions$key } from "@/__generated__/VariablesWithDefinitions.graphql";
import { ModelPageBodyFragment } from "@/app/users/[username]/models/[slug]/ModelPageBody";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { VariablesWithDefinitionsFragment } from "../variablesWithDefinitions/VariablesWithDefinitions";
import { SquiggleSnippetContentFragment } from "./SquiggleSnippetContent";

export const Mutation = graphql`
  mutation EditSquiggleSnippetModelMutation(
    $input: MutationUpdateSquiggleSnippetModelInput!
  ) {
    result: updateSquiggleSnippetModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on UpdateSquiggleSnippetResult {
        model {
          ...ModelPage
        }
      }
    }
  }
`;

type VariableWithDefinition = {
  variable: string;
  definition: {
    username: string;
    slug: string;
  };
};

type FormShape = {
  code: string;
  description: string;
  variablesWithDefinitions: VariableWithDefinition[];
};

const CreateVariableWithDefinitionModal: FC<{
  close: () => void;
  append: (item: VariableWithDefinition) => void;
}> = ({ close, append }) => {
  const { register, handleSubmit } = useForm<VariableWithDefinition>();

  const create = handleSubmit((data) => {
    append(data);
    close();
  });

  return (
    <Modal close={close} tailwindSelector="squiggle-hub">
      <Modal.Header>...</Modal.Header>
      <Modal.Body>
        <TextInput register={register} label="Variable" name="variable" />
        <TextInput
          register={register}
          label="Username"
          name="definition.username"
        />
        <TextInput register={register} label="Slug" name="definition.slug" />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={create} theme="primary">
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const VariablesWithDefinitionsControls: FC<{
  append: (item: VariableWithDefinition) => void;
  remove: (id: number) => void;
  items: VariableWithDefinition[];
}> = ({ append, remove, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <div>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div>
              {item.variable} &rarr; {item.definition.username}/
              {item.definition.slug}
            </div>
            <Button onClick={() => remove(i)}>Remove</Button>
          </div>
        ))}
      </div>
      <Button onClick={() => setIsOpen(true)}>Add interface</Button>
      {isOpen && (
        <CreateVariableWithDefinitionModal
          close={() => setIsOpen(false)}
          append={append}
        />
      )}
    </div>
  );
};

type Props = {
  // We have to pass the entire model here and not just content;
  // it's too hard to split the editing form into "content-type-specific" part and "generic model fields" part.
  modelRef: ModelPageBody$key;
};

export const EditSquiggleSnippetModel: FC<Props> = ({ modelRef }) => {
  const toast = useToast();
  const { data: session } = useSession();

  const model = useFragment(ModelPageBodyFragment, modelRef);
  const content = useFragment<SquiggleSnippetContent$key>(
    SquiggleSnippetContentFragment,
    model.currentRevision.content
  );

  // borrowing fragment to populate form
  // TODO - should be encapsulated in VariablesWithDefinitions/useVariablesWithDefinitionsData.ts
  const { variablesWithDefinitions } =
    useFragment<VariablesWithDefinitions$key>(
      VariablesWithDefinitionsFragment,
      model.currentRevision
    );

  const initialFormValues: FormShape = useMemo(() => {
    return {
      code: content.code,
      description: model.currentRevision.description,
      variablesWithDefinitions: variablesWithDefinitions.map((item) => ({
        variable: item.variable,
        definition: {
          username: item.definition.owner.username,
          slug: item.definition.slug,
        },
      })),
    };
  }, [model, content, variablesWithDefinitions]);

  const { handleSubmit, control, register } = useForm<FormShape>({
    defaultValues: initialFormValues,
  });

  const {
    fields: variablesWithDefinitionsFields,
    append: appendVariableWithDefinition,
    remove: removeVariableWithDefinition,
  } = useFieldArray({
    name: "variablesWithDefinitions",
    control,
  });

  const [saveMutation] =
    useMutation<EditSquiggleSnippetModelMutation>(Mutation);

  const save = handleSubmit((formData) => {
    saveMutation({
      variables: {
        input: {
          content: {
            code: formData.code,
          },
          variablesWithDefinitions: formData.variablesWithDefinitions,
          slug: model.slug,
          username: model.owner.username,
          description: formData.description,
        },
      },
      onCompleted(data) {
        if (data.result.__typename === "BaseError") {
          toast(data.result.message, "error");
        } else {
          toast("Saved", "confirmation");
        }
      },
      onError(e) {
        toast(e.toString(), "error");
      },
    });
  });

  const canSave = session?.user.username === model.owner.username;

  return (
    <form onSubmit={save}>
      <WithTopMenu>
        <div className="max-w-2xl mx-auto">
          {canSave ? null : (
            <div className="text-xs">
              {"You don't own this model, edits won't be saved."}
            </div>
          )}
          {session?.user.username === model.owner.username ? (
            <div className="mt-2">
              <TextArea
                register={register}
                name="description"
                label="Description"
              />
            </div>
          ) : null}
          <div className="mt-2">
            <VariablesWithDefinitionsControls
              append={appendVariableWithDefinition}
              remove={removeVariableWithDefinition}
              items={variablesWithDefinitionsFields}
            />
          </div>
        </div>
        <Controller
          name="code"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SquigglePlayground
              onCodeChange={field.onChange}
              code={field.value}
              renderExtraControls={() =>
                canSave ? (
                  <Button theme="primary" onClick={save} wide>
                    Save
                  </Button>
                ) : null
              }
            />
          )}
        />
      </WithTopMenu>
    </form>
  );
};
