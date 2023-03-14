import { getQuriCatalogAndModel } from "@/builtins/quri";
import { getQuriSoftwareCatalogAndModel } from "@/builtins/quri-software";
import { modelFromJSON, modelToJSON } from "@/model/utils";
import { FC, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Dropdown } from "../ui/Dropdown";
import { FormHeader } from "../ui/FormHeader";
import {
  DashboardContextShape,
  useDashboardContext,
  useDashboardDispatch,
} from "./DashboardProvider";

const SaveButton: FC = () => {
  const [isCopied, setIsCopied] = useState(false);

  const context = useDashboardContext();

  const copy = () => {
    const jsonContext = {
      ...context,
      model: modelToJSON(context.model),
    };

    navigator.clipboard.writeText(JSON.stringify(jsonContext));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={copy} className="w-40">
        {isCopied ? (
          <span className="text-xs">Saved to clipboard!</span>
        ) : (
          "Save"
        )}
      </Button>
    </div>
  );
};

const LoadPresetButton: FC<{
  getPreset(): DashboardContextShape;
  close(): void;
  name: string;
}> = ({ getPreset, name, close }) => {
  const dispatch = useDashboardDispatch();
  return (
    <Button
      onClick={() => {
        dispatch({
          type: "load",
          payload: getPreset(),
        });
        close();
      }}
    >
      {name}
    </Button>
  );
};

const LoadJSONControls: FC<{
  close(): void;
}> = ({ close }) => {
  const [value, setValue] = useState("{}");
  const dispatch = useDashboardDispatch();

  const parsedValue = useMemo(() => {
    try {
      const parsed = JSON.parse(value);
      if (parsed.model && parsed.catalog) {
        // TODO - better validation
        return {
          ...parsed,
          model: modelFromJSON(parsed.model),
        };
      }
    } catch {}

    return;
  }, [value]);

  const load = () => {
    dispatch({
      type: "load",
      payload: parsedValue,
    });
    close();
  };
  return (
    <div className="flex flex-col items-end gap-2">
      {/* TODO - extract styles to Textarea component */}
      <textarea
        className="p-1 rounded border border-gray-200 w-full"
        placeholder="Paste JSON here"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
      />
      <Button onClick={load} disabled={!parsedValue}>
        Load
      </Button>
    </div>
  );
};

const LoadButton: FC = () => {
  const renderMenu = ({ close }: { close(): void }) => {
    return (
      <div className="p-1 w-80">
        <div className="flex flex-col gap-4">
          <div>
            <FormHeader>Presets</FormHeader>
            <div className="flex gap-2">
              <LoadPresetButton
                getPreset={getQuriCatalogAndModel}
                name="QURI"
                close={close}
              />
              <LoadPresetButton
                getPreset={getQuriSoftwareCatalogAndModel}
                name="QURI software"
                close={close}
              />
            </div>
          </div>
          <div>
            <FormHeader>JSON</FormHeader>
            <LoadJSONControls close={close} />
          </div>
        </div>
      </div>
    );
  };
  return (
    <Dropdown render={renderMenu}>
      <Button>Load</Button>
    </Dropdown>
  );
};

export const Toolbar: FC = () => {
  return (
    <div className="flex items-center gap-2">
      <SaveButton />
      <LoadButton />
    </div>
  );
};
