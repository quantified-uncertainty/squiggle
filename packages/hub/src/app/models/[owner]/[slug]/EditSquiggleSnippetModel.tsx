import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BaseSyntheticEvent, FC, use, useMemo, useState } from "react";
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
  checkSquiggleVersion,
  SquigglePlaygroundVersionPicker,
  type SquiggleVersion,
  SquiggleVersionShower,
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
  versionSupportsDropdownMenu,
  versionSupportsExports,
  versionSupportsImportTooltip,
  versionSupportsOnOpenExport,
} from "@quri/versioned-squiggle-components";

import { EditRelativeValueExports } from "@/components/exports/EditRelativeValueExports";
import { ReactRoot } from "@/components/ReactRoot";
import { FormModal } from "@/components/ui/FormModal";
import { SAMPLE_COUNT_DEFAULT, XY_POINT_LENGTH_DEFAULT } from "@/constants";
import { useAvailableHeight } from "@/hooks/useAvailableHeight";
import { useMutationForm } from "@/hooks/useMutationForm";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { modelRoute, variableRoute } from "@/routes";
import { ImportTooltip } from "@/squiggle/components/ImportTooltip";
import {
  parseSourceId,
  serializeSourceId,
  squiggleHubLinker,
} from "@/squiggle/components/linker";

import {
  Draft,
  draftUtils,
  SquiggleSnippetDraftDialog,
  useDraftLocator,
} from "./SquiggleSnippetDraftDialog";

import { EditSquiggleSnippetModel$key } from "@/__generated__/EditSquiggleSnippetModel.graphql";
import {
  EditSquiggleSnippetModelMutation,
  RelativeValuesExportInput,
} from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";

export type SquiggleSnippetFormShape = {
  code: string;
  relativeValuesExports: RelativeValuesExportInput[];
};

type OnSubmit = (
  event?: BaseSyntheticEvent,
  extraData?: { comment: string }
) => Promise<void>;

const SaveDialog: FC<{ onSubmit: OnSubmit; close: () => void }> = ({
  onSubmit,
  close,
}) => {
  type SaveFormShape = {
    comment: string;
  };
  const form = useForm<SaveFormShape>();

  const handleSubmit = form.handleSubmit(async ({ comment }, event) => {
    await onSubmit(event, { comment });
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
  const { data: session } = useSession();

  const model = useFragment(
    graphql`
      fragment EditSquiggleSnippetModel on Model {
        id
        slug
        isEditable
        ...EditRelativeValueExports_Model
        ...SquiggleSnippetDraftDialog_Model
        owner {
          slug
        }
        lastRevisionWithBuild {
          lastBuild {
            runSeconds
          }
        }
        currentRevision {
          id
          content {
            __typename
            ... on SquiggleSnippet {
              id
              code
              version
              seed
              autorunMode
              sampleCount
              xyPointLength
            }
          }
          exportNames
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
  const router = useRouter();

  const content = extractFromGraphqlErrorUnion(
    revision.content,
    "SquiggleSnippet"
  );

  const lastBuildSpeed = model.lastRevisionWithBuild?.lastBuild?.runSeconds;

  const seed = content.seed;

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
          seed: seed,
          autorunMode: content.autorunMode,
          sampleCount: content.sampleCount,
          xyPointLength: content.xyPointLength,
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

  const checkedVersion = useAdjustSquiggleVersion(version);

  const squiggle = use(versionedSquigglePackages(checkedVersion));

  // Automatically turn off autorun, if the last build speed was > 5s. Note that this does not stop in the case of memory errors or similar.
  const autorunMode =
    content.autorunMode ||
    (lastBuildSpeed ? (lastBuildSpeed > 5 ? false : true) : true);

  // Build props for versioned SquigglePlayground first, since they might depend on the version we use,
  // and we want to populate them incrementally.
  const playgroundProps: Parameters<
    typeof squiggle.components.SquigglePlayground
  >[0] = {
    defaultCode,
    autorunMode: autorunMode,
    sourceId: serializeSourceId({
      owner: model.owner.slug,
      slug: model.slug,
    }),
    linker: squiggleHubLinker,
    height: height ?? "100vh",
    onCodeChange,
    renderExtraControls: () => (
      <div className="flex h-full items-center justify-end gap-2">
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
    ),
    renderExtraModal: (name) => {
      if (name === "Relative Values") {
        return {
          body: (
            <div className="px-6 py-2">
              <EditRelativeValueExports
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
          title: "Relative Value Exports",
        };
      }
    },
  };

  /* This is an example of how we could narrow versions to inject props conditionally.
   * (In this simple case, we could always set `renderExtraDropdownItems` prop since it'd be ignored by older playground versions.)
   * It relies on `versionSupportsDropdownMenu` type predicate which narrows down `playgroundProps` type.
   */
  if (
    versionSupportsDropdownMenu.propsByVersion<"SquigglePlayground">(
      squiggle.version,
      playgroundProps
    )
  ) {
    playgroundProps.renderExtraDropdownItems = ({ openModal }) =>
      model.isEditable ? (
        <>
          <DropdownMenuHeader>Experimental</DropdownMenuHeader>
          <DropdownMenuActionItem
            title="Relative Value Exports"
            icon={LinkIcon}
            onClick={() => openModal("Relative Values")}
          />
        </>
      ) : null;
  }

  if (
    versionSupportsExports.propsByVersion<"SquigglePlayground">(
      squiggle.version,
      playgroundProps
    )
  ) {
  }

  playgroundProps.environment = {
    sampleCount: content.sampleCount || SAMPLE_COUNT_DEFAULT,
    xyPointLength: content.xyPointLength || XY_POINT_LENGTH_DEFAULT,
    seed: seed,
  };

  if (
    versionSupportsOnOpenExport.propsByVersion<"SquigglePlayground">(
      squiggle.version,
      playgroundProps
    )
  ) {
    playgroundProps.onOpenExport = (sourceId: string, varName?: string) => {
      const { owner, slug } = parseSourceId(sourceId);
      if (varName) {
        router.push(
          variableRoute({ owner, modelSlug: slug, variableName: varName })
        );
      } else {
        router.push(modelRoute({ owner, slug }));
      }
    };
  }

  if (
    versionSupportsImportTooltip.propsByVersion<"SquigglePlayground">(
      squiggle.version,
      playgroundProps
    )
  ) {
    playgroundProps.renderImportTooltip = ({
      importId,
    }: {
      importId: string;
    }) => (
      <ReactRoot session={session}>
        <ImportTooltip importId={importId} />
      </ReactRoot>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={() => onSubmit()}>
        <div ref={ref}>
          <SquiggleSnippetDraftDialog
            draftLocator={draftLocator}
            restore={restoreDraft}
          />
          <squiggle.components.SquigglePlayground
            key={playgroundKey}
            {
              /* we have issues with renderImportTooltip prop compatibility, but `playgroundProps` should be correctly typed by this point */
              ...(playgroundProps as any)
            }
          />
        </div>
      </form>
    </FormProvider>
  );
};
