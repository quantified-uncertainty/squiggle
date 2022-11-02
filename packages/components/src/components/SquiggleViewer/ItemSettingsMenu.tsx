import { CogIcon } from "@heroicons/react/solid";
import React, { useContext, useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "../ui/Modal";
import { ViewSettingsForm, viewSettingsSchema } from "../ViewSettingsForm";
import { ViewerContext } from "./ViewerContext";
import { PlaygroundContext } from "../SquigglePlayground";
import { SqValue } from "@quri/squiggle-lang";
import { locationAsString } from "./utils";
import _ from "lodash";

type Props = {
  value: SqValue;
  onChange: () => void;
  disableLogX?: boolean;
  withFunctionSettings: boolean;
};

const ItemSettingsModal: React.FC<
  Props & { close: () => void; resetScroll: () => void }
> = ({
  value,
  onChange,
  disableLogX,
  withFunctionSettings,
  close,
  resetScroll,
}) => {
  const { setSettings, getSettings, getMergedSettings } =
    useContext(ViewerContext);

  const mergedSettings = getMergedSettings(value.location);

  const { register, watch } = useForm({
    resolver: yupResolver(viewSettingsSchema),
    defaultValues: mergedSettings,
  });
  useEffect(() => {
    const subscription = watch((vars) => {
      const settings = getSettings(value.location); // get the latest version
      setSettings(value.location, _.merge({}, settings, vars));
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
          disableLogXSetting={disableLogX}
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
