import { useSession } from "next-auth/react";
import { FC, useMemo } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { graphql, useFragment, useMutation } from "react-relay";

import { SquigglePlayground } from "@quri/squiggle-components";
import { Button, TextAreaFormField, useToast } from "@quri/ui";

import {
  EditSquiggleSnippetModelMutation,
  RelativeValuesExportInput,
} from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { SquiggleContent$key } from "@/__generated__/SquiggleContent.graphql";
import { ModelPageFragment } from "@/app/users/[username]/models/[slug]/ModelPage";
import { ModelRevisionFragment } from "@/app/users/[username]/models/[slug]/ModelRevision";
import { EditModelExports } from "@/components/exports/EditModelExports";
import { useAvailableHeight } from "@/hooks/useAvailableHeight";
import { SquiggleContentFragment } from "./SquiggleContent";

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

type FormShape = {
  code: string;
  description: string;
  relativeValuesExports: RelativeValuesExportInput[];
};

type Props = {
  // We have to pass the entire model here and not just content;
  // it's too hard to split the editing form into "content-type-specific" part and "generic model fields" part.
  modelRef: ModelPage$key;
};

export const EditSquiggleSnippetModel: FC<Props> = ({ modelRef }) => {
  const toast = useToast();
  const { data: session } = useSession();

  const model = useFragment(ModelPageFragment, modelRef);
  const revision = useFragment<ModelRevision$key>(
    ModelRevisionFragment,
    model.currentRevision
  );

  const content = useFragment<SquiggleContent$key>(
    SquiggleContentFragment,
    revision.content
  );

  const { height, ref } = useAvailableHeight();

  const initialFormValues: FormShape = useMemo(() => {
    return {
      code: content.code,
      description: revision.description,
      relativeValuesExports: revision.relativeValuesExports.map((item) => ({
        variableName: item.variableName,
        definition: {
          username: item.definition.owner.username,
          slug: item.definition.slug,
        },
      })),
    };
  }, [content, revision.description, revision.relativeValuesExports]);

  const form = useForm<FormShape>({
    defaultValues: initialFormValues,
  });

  const {
    fields: variablesWithDefinitionsFields,
    append: appendVariableWithDefinition,
    remove: removeVariableWithDefinition,
  } = useFieldArray({
    name: "relativeValuesExports",
    control: form.control,
  });

  const [saveMutation] =
    useMutation<EditSquiggleSnippetModelMutation>(Mutation);

  const save = form.handleSubmit((formData) => {
    saveMutation({
      variables: {
        input: {
          content: {
            code: formData.code,
          },
          relativeValuesExports: formData.relativeValuesExports,
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
    <FormProvider {...form}>
      <form onSubmit={save}>
        <div className="max-w-2xl mx-auto">
          {canSave ? null : (
            <div className="text-xs">
              {"You don't own this model, edits won't be saved."}
            </div>
          )}
          {session?.user.username === model.owner.username ? (
            <div className="mt-2">
              <TextAreaFormField name="description" label="Description" />
            </div>
          ) : null}
          <div className="mt-4">
            <header className="text-sm font-medium text-gray-600 mb-2">
              Views
            </header>
            <EditModelExports
              append={appendVariableWithDefinition}
              remove={removeVariableWithDefinition}
              items={variablesWithDefinitionsFields}
            />
          </div>
        </div>
        <div ref={ref}>
          <Controller
            name="code"
            rules={{ required: true }}
            render={({ field }) => (
              <SquigglePlayground
                height={height}
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
        </div>
      </form>
    </FormProvider>
  );
};
