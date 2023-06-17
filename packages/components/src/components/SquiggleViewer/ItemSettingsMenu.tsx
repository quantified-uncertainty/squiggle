import { CogIcon } from "@heroicons/react/solid/esm/index.js";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { SqValue } from "@quri/squiggle-lang";
import { Modal } from "@quri/ui";

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
import { locationAsString } from "./utils.js";

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

  const mergedSettings = getMergedSettings(value.location!);

  const form = useForm({
    resolver: zodResolver(viewSettingsSchema),
    defaultValues: mergedSettings,
    mode: "onChange",
  });

  useEffect(() => {
    const submit = form.handleSubmit((data) => {
      setSettings(value.location!, {
        collapsed: false,
        ...data,
      });
      onChange();
    });

    const subscription = form.watch(() => submit());
    return () => subscription.unsubscribe();
  }, [getSettings, setSettings, onChange, value.location, form.watch]);

  const { getLeftPanelElement } = useContext(PlaygroundContext);

  return (
    <Modal container={getLeftPanelElement()} close={close}>
      <Modal.Header>
        Chart settings
        {value.location!.path.items.length ? (
          <>
            {" for "}
            <span
              title="Scroll to item"
              className="cursor-pointer"
              onClick={resetScroll}
            >
              {locationAsString(value.location!)}
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
  const { localSettingsEnabled, getSettings } = useContext(ViewerContext);

  const ref = useRef<HTMLDivElement | null>(null);

  if (!localSettingsEnabled) {
    return null;
  }
  const settings = getSettings(props.value.location!);

  const resetScroll = () => {
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex gap-2" ref={ref}>
      <CogIcon
        className="h-5 w-5 cursor-pointer text-stone-300 hover:text-stone-500"
        onClick={() => setIsOpen(!isOpen)}
      />
      {settings.distributionChartSettings ? (
        <button
          onClick={() => {
            setSettings(props.value.location!, {
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
