import { FC, useMemo, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { graphql, useFragment } from "react-relay";

import {
  ButtonWithDropdown,
  CommentIcon,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuHeader,
  DropdownMenuModalActionItem,
  LinkIcon,
  TextAreaFormField,
  TextTooltip,
} from "@quri/ui";
import {
  SquigglePlaygroundVersionPicker,
  SquiggleVersionShower,
  VersionedSquigglePlayground,
  checkSquiggleVersion,
  type SquiggleVersion,
} from "@quri/versioned-playground";

import { EditSquiggleSnippetModel$key } from "@/__generated__/EditSquiggleSnippetModel.graphql";
import {
  EditSquiggleSnippetModelMutation,
  RelativeValuesExportInput,
} from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import { EditModelExports } from "@/components/exports/EditModelExports";
import { FormModal } from "@/components/ui/FormModal";
import { useAvailableHeight } from "@/hooks/useAvailableHeight";
import { useMutationForm } from "@/hooks/useMutationForm";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import {
  serializeSourceId,
  squiggleHubLinker,
} from "@/squiggle/components/linker";
import {
  Draft,
  SquiggleSnippetDraftDialog,
  draftUtils,
  useDraftLocator,
} from "./SquiggleSnippetDraftDialog";

export type SquiggleSnippetFormShape = {
  code: string;
  relativeValuesExports: RelativeValuesExportInput[];
};

type OnSubmit = (extraData?: { comment: string }) => Promise<void>;

const SaveDialog: FC<{ onSubmit: OnSubmit; close: () => void }> = ({
  onSubmit,
  close,
}) => {
  type SaveFormShape = {
    comment: string;
  };
  const form = useForm<SaveFormShape>();

  const handleSubmit = form.handleSubmit(async ({ comment }) => {
    await onSubmit({ comment });
    close();
  });

  return (
    <FormModal
      onSubmit={handleSubmit}
      title="Save with comment"
      form={form}
      close={close}
      submitText="Save"
    >
      <TextAreaFormField<SaveFormShape> name="comment" label="Comment" />
    </FormModal>
  );
};

const SaveButton: FC<{ onSubmit: OnSubmit; disabled: boolean }> = ({
  onSubmit,
  disabled,
}) => {
  return (
    <ButtonWithDropdown
      theme="primary"
      size="small"
      onClick={onSubmit}
      disabled={disabled}
      renderDropdown={({ close }) => (
        <DropdownMenu>
          <DropdownMenuModalActionItem
            title="Save with comment..."
            icon={CommentIcon}
            render={() => <SaveDialog onSubmit={onSubmit} close={close} />}
          />
        </DropdownMenu>
      )}
    >
      Save
    </ButtonWithDropdown>
  );
};

type Props = {
  // We have to pass the entire model here and not just content;
  // it's too hard to split the editing form into "content-type-specific" part and "generic model fields" part.
  modelRef: EditSquiggleSnippetModel$key;
  forceVersionPicker?: boolean;
};

export const EditSquiggleSnippetModel: FC<Props> = ({
  modelRef,
  forceVersionPicker,
}) => {
  const model = useFragment(
    graphql`
      fragment EditSquiggleSnippetModel on Model {
        id
        slug
        isEditable
        ...EditModelExports_Model
        ...SquiggleSnippetDraftDialog_Model
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

  const initialFormValues: SquiggleSnippetFormShape = useMemo(() => {
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
    SquiggleSnippetFormShape,
    EditSquiggleSnippetModelMutation,
    "UpdateSquiggleSnippetResult",
    { comment: string }
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
    formDataToVariables: (formData, extraData) => ({
      input: {
        content: {
          code: formData.code,
          version,
        },
        relativeValuesExports: formData.relativeValuesExports,
        comment: extraData?.comment,
        slug: model.slug,
        owner: model.owner.slug,
      },
    }),
    confirmation: "Saved",
    onCompleted() {
      draftUtils.discard(draftLocator);
    },
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

  const draftLocator = useDraftLocator(model);

  const onCodeChange = (code: string) => {
    form.setValue("code", code);
    if (model.isEditable) {
      draftUtils.save(draftLocator, { formState: form.getValues(), version });
    }
  };

  // We don't want to control SquigglePlayground, it's uncontrolled by design.
  // Instead, we reset the `defaultCode` that we pass to it when version is changed or draft is restored.
  const [defaultCode, setDefaultCode] = useState(content.code);
  // Used for forcefully resetting the playground component.
  const [playgroundKey, setPlaygroundKey] = useState(0);
  // Force playground re-render. Cursor position and any other state will be lost.
  const resetPlayground = () => {
    setDefaultCode(form.getValues("code"));
    setPlaygroundKey((key) => key + 1);
  };

  const handleVersionChange = (newVersion: SquiggleVersion) => {
    if (newVersion === version) {
      return;
    }
    setVersion(newVersion);
    resetPlayground();
  };

  const restoreDraft = (draft: Draft) => {
    form.reset(draft.formState);
    resetPlayground();

    if (checkSquiggleVersion(draft.version) && draft.version !== version) {
      handleVersionChange(draft.version);
    }
  };

  const { height, ref } = useAvailableHeight();

  return (
    <FormProvider {...form}>
      <form onSubmit={() => onSubmit()}>
        <div ref={ref}>
          <SquiggleSnippetDraftDialog
            draftLocator={draftLocator}
            restore={restoreDraft}
          />
          <VersionedSquigglePlayground
            key={playgroundKey}
            version={version}
            sourceId={serializeSourceId({
              owner: model.owner.slug,
              slug: model.slug,
            })}
            linker={squiggleHubLinker}
            height={height ?? "100vh"}
            onCodeChange={onCodeChange}
            defaultCode={defaultCode}
            renderExtraDropdownItems={({ openModal }) =>
              model.isEditable ? (
                <>
                  <DropdownMenuHeader>Experimental</DropdownMenuHeader>
                  <DropdownMenuActionItem
                    title="Exported Variables"
                    icon={LinkIcon}
                    onClick={() => openModal("exports")}
                  />
                </>
              ) : null
            }
            renderExtraControls={() => (
              <div className="h-full flex items-center justify-end gap-2">
                {model.isEditable || forceVersionPicker ? (
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
                  <SaveButton onSubmit={onSubmit} disabled={inFlight} />
                )}
              </div>
            )}
            renderExtraModal={(name) => {
              if (name === "exports") {
                return {
                  body: (
                    <div className="px-6 py-2">
                      <EditModelExports
                        append={(item) => {
                          appendVariableWithDefinition(item);
                          onSubmit();
                        }}
                        remove={(id) => {
                          removeVariableWithDefinition(id);
                          onSubmit();
                        }}
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
