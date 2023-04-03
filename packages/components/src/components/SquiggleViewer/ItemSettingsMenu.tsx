import { CogIcon } from "@heroicons/react/solid/esm/index.js";
import React, { useContext, useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { SqValue } from "@quri/squiggle-lang";

import { Modal } from "../ui/Modal.js";
import {
  PartialViewSettings,
  ViewSettingsForm,
  viewSettingsSchema,
} from "../ViewSettingsForm.js";
import { ViewerContext } from "./ViewerContext.js";
import { PlaygroundContext } from "../SquigglePlayground/index.js";
import { locationAsString } from "./utils.js";
import merge from "lodash/merge.js";

type Props = {
  value: SqValue;
  onChange: () => void;
  fixed?: PartialViewSettings;
  withFunctionSettings: boolean;
};

const ItemSettingsModal: React.FC<
  Props & { close: () => void; resetScroll: () => void }
> = ({ value, onChange, fixed, withFunctionSettings, close, resetScroll }) => {
  const { setSettings, getSettings, getMergedSettings } =
    useContext(ViewerContext);

  const mergedSettings = merge(getMergedSettings(value.location), fixed);

  const { register, watch } = useForm({
    resolver: yupResolver(viewSettingsSchema),
    defaultValues: mergedSettings,
  });
  useEffect(() => {
    const subscription = watch((vars) => {
      const settings = getSettings(value.location); // get the latest version
      setSettings(value.location, merge({}, settings, vars));
      onChange();
    });
    return () => subscription.unsubscribe();
  }, [getSettings, setSettings, onChange, value.location, watch]);

  const { getLeftPanelElement } = useContext(PlaygroundContext);

  return (
    <Modal container={getLeftPanelElement()} close={close}>
      <Modal.Header>
        Chart settings
        {value.location.path.items.length ? (
          <>
            {" for "}
            <span
              title="Scroll to item"
              className="cursor-pointer"
              onClick={resetScroll}
            >
              {locationAsString(value.location)}
            </span>{" "}
          </>
        ) : (
          ""
        )}
      </Modal.Header>
      <Modal.Body>
        <ViewSettingsForm
          register={register}
          withFunctionSettings={withFunctionSettings}
          fixed={fixed}
        />
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
  const settings = getSettings(props.value.location);

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
        className="h-5 w-5 cursor-pointer text-slate-400 hover:text-slate-500"
        onClick={() => setIsOpen(!isOpen)}
      />
      {settings.distributionChartSettings || settings.functionChartSettings ? (
        <button
          onClick={() => {
            setSettings(props.value.location, {
              ...settings,
              distributionChartSettings: undefined,
              functionChartSettings: undefined,
            });
            props.onChange();
          }}
          className="text-xs px-1 py-0.5 rounded bg-slate-300"
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
