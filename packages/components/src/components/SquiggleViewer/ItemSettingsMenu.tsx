import { CogIcon } from "@heroicons/react/solid/esm/index.js";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { SqValue } from "@quri/squiggle-lang";
import { Modal, TextTooltip } from "@quri/ui";

import {
  MetaSettings,
  PlaygroundSettingsForm,
  viewSettingsSchema,
} from "../PlaygroundSettings.js";
import { PlaygroundContext } from "../SquigglePlayground/index.js";
import {
  ViewerContext,
  useSetSettings,
  useViewerContext,
} from "./ViewerProvider.js";
import { pathAsString } from "./utils.js";

type Props = {
  value: SqValue;
  onChange: () => void;
  metaSettings?: MetaSettings;
  withFunctionSettings: boolean;
};

const ItemSettingsModal: React.FC<
  Props & { close: () => void; resetScroll: () => void }
> = ({
  value,
  onChange,
  metaSettings,
  withFunctionSettings,
  close,
  resetScroll,
}) => {
  const setSettings = useSetSettings();
  const { getSettings, getMergedSettings } = useViewerContext();

  if (!value.path) {
    throw new Error("Can't render settings modal for pathless value");
  }

  const mergedSettings = getMergedSettings({ path: value.path });

  const form = useForm({
    resolver: zodResolver(viewSettingsSchema),
    defaultValues: mergedSettings,
    mode: "onChange",
  });

  useEffect(() => {
    const submit = form.handleSubmit((data) => {
      if (!value.path) {
        return; // satisfies TypeScript
      }
      setSettings(value.path, {
        collapsed: false,
        ...data,
      });
      onChange();
    });

    const subscription = form.watch(() => submit());
    return () => subscription.unsubscribe();
  }, [getSettings, setSettings, onChange, value.path, form]);

  const { getLeftPanelElement } = useContext(PlaygroundContext);

  return (
    <Modal container={getLeftPanelElement()} close={close}>
      <Modal.Header>
        Chart settings
        {value.path.items.length ? (
          <>
            {" for "}
            <span
              title="Scroll to item"
              className="cursor-pointer"
              onClick={resetScroll}
            >
              {pathAsString(value.path)}
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

export const ItemSettingsMenu: React.FC<Props> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const setSettings = useSetSettings();
  const { localSettingsEnabled, getSettings, dispatch } =
    useContext(ViewerContext);

  const ref = useRef<HTMLDivElement | null>(null);

  if (!localSettingsEnabled) {
    return null;
  }
  if (!props.value.path) {
    throw new Error("Can't render settings menu for pathless value");
  }

  const settings = getSettings({ path: props.value.path });

  const resetScroll = () => {
    if (!props.value.path) {
      return;
    }
    dispatch({
      type: "SCROLL_TO_PATH",
      payload: {
        path: props.value.path,
      },
    });
  };

  return (
    <div className="flex gap-2" ref={ref}>
      <TextTooltip text="Settings" placement="bottom">
        <CogIcon
          className="h-5 w-5 cursor-pointer text-stone-100 hover:!text-stone-500 group-hover:text-stone-400 transition"
          onClick={() => setIsOpen(!isOpen)}
        />
      </TextTooltip>
      {settings.distributionChartSettings ? (
        <button
          onClick={() => {
            if (!props.value.path) {
              // shouldn't happen, satisfies TypeScript
              return;
            }
            setSettings(props.value.path, {
              collapsed: settings.collapsed,
            });
            props.onChange();
          }}
          className="text-xs px-1 py-0.5 rounded bg-stone-200 hover:bg-stone-400"
        >
          Reset settings
        </button>
      ) : null}
      {isOpen ? (
        <ItemSettingsModal
          {...props}
          close={() => setIsOpen(false)}
          resetScroll={resetScroll}
        />
      ) : null}
    </div>
  );
};
