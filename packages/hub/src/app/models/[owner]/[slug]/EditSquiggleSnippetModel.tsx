import { FC, useMemo, useState } from "react";
import { FormProvider, useFieldArray } from "react-hook-form";
import { graphql, useFragment } from "react-relay";

import { PlaygroundToolbarItem } from "@quri/squiggle-components";
import { Button, LinkIcon, TextTooltip } from "@quri/ui";
import {
  SquigglePlaygroundVersionPicker,
  SquiggleVersionShower,
  VersionedSquigglePlayground,
  type SquiggleVersion,
} from "@quri/versioned-playground";

import { EditSquiggleSnippetModel$key } from "@/__generated__/EditSquiggleSnippetModel.graphql";
import {
  EditSquiggleSnippetModelMutation,
  RelativeValuesExportInput,
} from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import { EditModelExports } from "@/components/exports/EditModelExports";
import { useAvailableHeight } from "@/hooks/useAvailableHeight";
import { useMutationForm } from "@/hooks/useMutationForm";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { squiggleHubLinker } from "@/squiggle/components/linker";

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
              version
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

  const { form, onSubmit, inFlight } = useMutationForm<
    FormShape,
    EditSquiggleSnippetModelMutation,
    "UpdateSquiggleSnippetResult"
  >({
    defaultValues: initialFormValues,
    mutation: graphql`
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
    `,
    expectedTypename: "UpdateSquiggleSnippetResult",
    formDataToVariables: (formData) => ({
      input: {
        content: {
          code: formData.code,
          version,
        },
        relativeValuesExports: formData.relativeValuesExports,
        slug: model.slug,
        owner: model.owner.slug,
      },
    }),
    confirmation: "Saved",
  });

  // could version picker be part of the form?
  const [version, setVersion] = useState(content.version);

  const {
    fields: variablesWithDefinitionsFields,
    append: appendVariableWithDefinition,
    remove: removeVariableWithDefinition,
  } = useFieldArray({
    name: "relativeValuesExports",
    control: form.control,
  });

  const onCodeChange = (code: string) => {
    form.setValue("code", code);
  };

  // We don't want to control SquigglePlayground, it's uncontrolled by design.
  // Instead, we reset the `defaultCode` that we pass to it when version is changed.
  const [defaultCode, setDefaultCode] = useState(content.code);

  const handleVersionChange = (newVersion: SquiggleVersion) => {
    setVersion(newVersion);
    setDefaultCode(form.getValues("code"));
  };

  const { height, ref } = useAvailableHeight();

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <div ref={ref}>
          <VersionedSquigglePlayground
            version={version}
            linker={squiggleHubLinker}
            height={height ?? "100vh"}
            onCodeChange={onCodeChange}
            defaultCode={defaultCode}
            renderExtraControls={({ openModal }) => (
              <div className="h-full flex items-center justify-end gap-2">
                {model.isEditable && (
                  <PlaygroundToolbarItem
                    tooltipText="Exported Variables"
                    icon={LinkIcon}
                    onClick={() => openModal("exports")}
                  />
                )}
                {model.isEditable ? (
                  <SquigglePlaygroundVersionPicker
                    version={version}
                    onChange={handleVersionChange}
                    size="small"
                    showUpdatePolicy
                  />
                ) : (
                  <TextTooltip
                    text="Squiggle Version" // FIXME - positioning is bad for some reason
                    placement="bottom"
                    offset={5}
                  >
                    {/* div wrapper is required because TextTooltip clones its children and SquiggleVersionShower doesn't forwardRef */}
                    <div>
                      <SquiggleVersionShower version={version} />
                    </div>
                  </TextTooltip>
                )}
                {model.isEditable && (
                  <Button
                    theme="primary"
                    onClick={onSubmit}
                    size="small"
                    disabled={inFlight}
                  >
                    Save
                  </Button>
                )}
              </div>
            )}
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
