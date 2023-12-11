import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useContext, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  Cog8ToothIcon,
  DropdownMenuActionItem,
  DropdownMenuModalActionItem,
  Modal,
  ResetIcon,
  useCloseDropdown,
} from "@quri/ui";

import { SqValueWithContext } from "../../lib/utility.js";
import {
  MetaSettings,
  PlaygroundSettingsForm,
  viewSettingsSchema,
} from "../PlaygroundSettings.js";
import { PlaygroundContext } from "../SquigglePlayground/index.js";
import { pathAsString } from "./utils.js";
import {
  useHasLocalSettings,
  useMergedSettings,
  useResetStateSettings,
  useSetLocalItemState,
  ViewerContext,
} from "./ViewerProvider.js";

type Props = {
  value: SqValueWithContext;
  metaSettings?: MetaSettings;
  withFunctionSettings: boolean;
};

const ItemSettingsModal: FC<Props> = ({
  value,
  metaSettings,
  withFunctionSettings,
}) => {
  const close = useCloseDropdown();
  const setLocalItemState = useSetLocalItemState();

  const { path } = value.context;

  const mergedSettings = useMergedSettings(path);

  const form = useForm({
    resolver: zodResolver(viewSettingsSchema),
    defaultValues: mergedSettings,
    mode: "onChange",
  });

  useEffect(() => {
    const submit = form.handleSubmit((data) => {
      setLocalItemState(path, {
        collapsed: false,
        settings: data,
      });
    });

    const subscription = form.watch(() => submit());
    return () => subscription.unsubscribe();
  }, [setLocalItemState, path, form]);

  const { getLeftPanelElement } = useContext(PlaygroundContext);

  const { dispatch } = useContext(ViewerContext);
  const resetScroll = () => {
    dispatch({
      type: "SCROLL_TO_PATH",
      payload: { path },
    });
  };

  return (
    <Modal container={getLeftPanelElement()} close={close}>
      <Modal.Header>
        Chart settings
        {path.items.length ? (
          <>
            {" for "}
            <span
              title="Scroll to item"
              className="cursor-pointer"
              onClick={resetScroll}
            >
              {pathAsString(path)}
            </span>
          </>
        ) : (
          ""
        )}
      </Modal.Header>
      <Modal.Body>
        <FormProvider {...form}>
          <PlaygroundSettingsForm
            withGlobalSettings={false}
            withFunctionSettings={withFunctionSettings}
            metaSettings={metaSettings}
          />
        </FormProvider>
      </Modal.Body>
    </Modal>
  );
};

const ResetSettingsItem: FC<Props> = (props) => {
  const closeDropdown = useCloseDropdown();
  const resetStateSettings = useResetStateSettings();

  return (
    <DropdownMenuActionItem
      onClick={() => {
        resetStateSettings(props.value.context.path);
        closeDropdown();
      }}
      title="Reset Settings"
      icon={ResetIcon}
    />
  );
};

export const ItemSettingsMenuItems: FC<Props> = (props) => {
  const hasLocalSettings = useHasLocalSettings(props.value.context.path);

  return (
    <>
      <DropdownMenuModalActionItem
        title="Chart Settings"
        icon={Cog8ToothIcon}
        render={() => <ItemSettingsModal {...props} />}
      />
      {hasLocalSettings && <ResetSettingsItem {...props} />}
    </>
  );
};
