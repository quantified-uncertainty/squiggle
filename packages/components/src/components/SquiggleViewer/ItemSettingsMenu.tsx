import { CogIcon } from "@heroicons/react/solid/esm/index.js";
import { zodResolver } from "@hookform/resolvers/zod";
import merge from "lodash/merge.js";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { SqValue } from "@quri/squiggle-lang";
import { Modal } from "@quri/ui";

import { PlaygroundContext } from "../SquigglePlayground/index.js";
import {
  PartialPlaygroundSettings,
  PlaygroundSettingsForm,
  viewSettingsSchema,
} from "../PlaygroundSettings.js";
import { ViewerContext } from "./ViewerContext.js";
import { locationAsString } from "./utils.js";

type Props = {
  value: SqValue;
  onChange: () => void;
  fixed?: PartialPlaygroundSettings;
  withFunctionSettings: boolean;
};

const ItemSettingsModal: React.FC<
  Props & { close: () => void; resetScroll: () => void }
> = ({ value, onChange, fixed, withFunctionSettings, close, resetScroll }) => {
  const { setSettings, getSettings, getMergedSettings } =
    useContext(ViewerContext);

  const mergedSettings = merge(getMergedSettings(value.location!), fixed);

  const form = useForm({
    resolver: zodResolver(viewSettingsSchema),
    defaultValues: mergedSettings,
    mode: "onChange",
  });
  useEffect(() => {
    const subscription = form.watch((vars) => {
      const settings = getSettings(value.location!); // get the latest version
      setSettings(value.location!, merge({}, settings, vars));
      onChange();
    });
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
            </span>{" "}
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
            fixed={fixed}
          />
        </FormProvider>
      </Modal.Body>
    </Modal>
  );
};

export const ItemSettingsMenu: React.FC<Props> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { enableLocalSettings, setSettings, getSettings } =
    useContext(ViewerContext);

  const ref = useRef<HTMLDivElement | null>(null);

  if (!enableLocalSettings) {
    return null;
  }
  const settings = getSettings(props.value.location!);

  const resetScroll = () => {
    if (!ref.current) return;
    window.scroll({
      top: ref.current.getBoundingClientRect().y + window.scrollY,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex gap-2" ref={ref}>
      <CogIcon
        className="h-5 w-5 cursor-pointer text-stone-200 hover:text-stone-500"
        onClick={() => setIsOpen(!isOpen)}
      />
      {settings.distributionChartSettings ? (
        <button
          onClick={() => {
            setSettings(props.value.location!, {
              ...settings,
              distributionChartSettings: undefined,
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
