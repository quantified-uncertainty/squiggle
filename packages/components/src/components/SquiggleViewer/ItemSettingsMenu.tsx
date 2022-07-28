import { CogIcon } from "@heroicons/react/solid";
import React, { useContext, useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "../ui/Modal";
import {
  ViewSettings,
  ViewSettingsFormFields,
  viewSettingsSchema,
} from "../ViewSettings";
import { Path, pathAsString } from "./utils";
import { ViewerContext } from "./ViewerContext";
import { PlaygroundContext } from "../SquigglePlayground";

type Props = {
  path: Path;
  onChange: () => void;
  disableLogX?: boolean;
  withFunctionSettings: boolean;
};

const ItemSettingsModal: React.FC<
  Props & { close: () => void; resetScroll: () => void }
> = ({
  path,
  onChange,
  disableLogX,
  withFunctionSettings,
  close,
  resetScroll,
}) => {
  const { setSettings, getSettings, getMergedSettings } =
    useContext(ViewerContext);

  const mergedSettings = getMergedSettings(path);

  const { register, watch } = useForm<ViewSettingsFormFields>({
    resolver: yupResolver(viewSettingsSchema),
    defaultValues: {
      showEditor: true, // doesn't matter
      chartHeight: mergedSettings.height,
      plotSettings: mergedSettings.plotSettings,
      functionSettings: mergedSettings.functionSettings,
    },
  });

  useEffect(() => {
    const subscription = watch((vars) => {
      const settings = getSettings(path); // get the latest version
      setSettings(path, {
        ...settings,
        // vars should be defined and react-hook-form is too conservative with its types so these `?.` are ok... hopefully.
        // This might cause a bug in the future. I don't really understand why react-hook-form needs to return partials here.
        plotSettings: vars?.plotSettings,
        functionSettings: vars?.functionSettings,
      });
      onChange();
    });
    return () => subscription.unsubscribe();
  }, [getSettings, setSettings, onChange, path, watch]);

  const { getLeftPanelElement } = useContext(PlaygroundContext);

  return (
    <Modal container={getLeftPanelElement()} close={close}>
      <Modal.Header>
        Chart settings
        {path.length ? (
          <>
            {" for "}
            <span
              title="Scroll to item"
              className="cursor-pointer"
              onClick={resetScroll}
            >
              {pathAsString(path)}
            </span>{" "}
          </>
        ) : (
          ""
        )}
      </Modal.Header>
      <Modal.Body>
        <ViewSettings
          register={register}
          withShowEditorSetting={false}
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
  const settings = getSettings(props.path);

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
      {settings.plotSettings || settings.functionSettings ? (
        <button
          onClick={() => {
            setSettings(props.path, {
              ...settings,
              plotSettings: undefined,
              functionSettings: undefined,
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
