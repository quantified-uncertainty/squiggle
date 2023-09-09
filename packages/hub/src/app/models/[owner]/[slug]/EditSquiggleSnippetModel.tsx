import { FC, useMemo } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { graphql, useFragment } from "react-relay";

import {
  PlaygroundToolbarItem,
  SquigglePlayground,
} from "@quri/squiggle-components";
import { Button, LinkIcon, useToast } from "@quri/ui";

import { EditSquiggleSnippetModel$key } from "@/__generated__/EditSquiggleSnippetModel.graphql";
import {
  EditSquiggleSnippetModelMutation,
  RelativeValuesExportInput,
} from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import { EditModelExports } from "@/components/exports/EditModelExports";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { useAvailableHeight } from "@/hooks/useAvailableHeight";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";

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
          ...EditSquiggleSnippetModel
        }
      }
    }
  }
`;

type FormShape = {
  code: string;
  relativeValuesExports: RelativeValuesExportInput[];
};

type Props = {
  // We have to pass the entire model here and not just content;
  // it's too hard to split the editing form into "content-type-specific" part and "generic model fields" part.
  modelRef: EditSquiggleSnippetModel$key;
};

export const EditSquiggleSnippetModel: FC<Props> = ({ modelRef }) => {
  const toast = useToast();

  const model = useFragment(
    graphql`
      fragment EditSquiggleSnippetModel on Model {
        id
        slug
        isEditable
        ...EditModelExports_Model
        owner {
          slug
        }
        currentRevision {
          id
          content {
            __typename
            ... on SquiggleSnippet {
              id
              code
            }
          }

          relativeValuesExports {
            id
            variableName
            definition {
              slug
              owner {
                slug
              }
            }
          }
        }
      }
    `,
    modelRef
  );
  const revision = model.currentRevision;

  const content = extractFromGraphqlErrorUnion(
    revision.content,
    "SquiggleSnippet"
  );

  const { height, ref } = useAvailableHeight();

  const initialFormValues: FormShape = useMemo(() => {
    return {
      code: content.code,
      relativeValuesExports: revision.relativeValuesExports.map((item) => ({
        variableName: item.variableName,
        definition: {
          owner: item.definition.owner.slug,
          slug: item.definition.slug,
        },
      })),
    };
  }, [content, revision.relativeValuesExports]);

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

  const [saveMutation, saveInFlight] = useAsyncMutation<
    EditSquiggleSnippetModelMutation,
    "UpdateSquiggleSnippetResult"
  >({
    mutation: Mutation,
    expectedTypename: "UpdateSquiggleSnippetResult",
  });

  const save = form.handleSubmit((formData) => {
    saveMutation({
      variables: {
        input: {
          content: {
            code: formData.code,
          },
          relativeValuesExports: formData.relativeValuesExports,
          slug: model.slug,
          owner: model.owner.slug,
        },
      },
      onCompleted: () => toast("Saved", "confirmation"),
    });
  });

  const onCodeChange = (code: string) => {
    form.setValue("code", code);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={save}>
        <div ref={ref}>
          <SquigglePlayground
            height={height ?? "100vh"}
            onCodeChange={onCodeChange}
            defaultCode={content.code}
            renderExtraControls={({ openModal }) =>
              model.isEditable && (
                <div className="h-full flex items-center justify-end gap-2">
                  <PlaygroundToolbarItem
                    tooltipText={"Exported Variables"}
                    icon={LinkIcon}
                    onClick={() => openModal("exports")}
                  ></PlaygroundToolbarItem>
                  <Button
                    theme="primary"
                    onClick={save}
                    size="small"
                    disabled={saveInFlight}
                  >
                    Save
                  </Button>
                </div>
              )
            }
            renderExtraModal={(name) => {
              if (name === "exports") {
                return {
                  body: (
                    <div className="px-6 py-2">
                      <EditModelExports
                        append={appendVariableWithDefinition}
                        remove={removeVariableWithDefinition}
                        items={variablesWithDefinitionsFields}
                        modelRef={model}
                      />
                    </div>
                  ),
                  title: "Exported Variables",
                };
              }
            }}
          />
        </div>
      </form>
    </FormProvider>
  );
};
