import { interfaceRoute, modelRoute } from "@/routes";
import clsx from "clsx";
import { useRouter } from "next/router";
import { FC } from "react";
import { Dropdown } from "../ui/Dropdown";
import {
  useInterfaceContext,
  useInterfaceDispatch,
  useSelectedModel,
} from "./InterfaceProvider";

const ModelPickerMenu: FC<{ close(): void }> = ({ close }) => {
  const { currentModel, models, catalog } = useInterfaceContext();
  const dispatch = useInterfaceDispatch();

  const { pathname } = useRouter();

  const pick = (id: string) => {
    dispatch({
      type: "selectModel",
      payload: id,
    });

    if (pathname.startsWith("/interfaces")) {
      window.history.replaceState(undefined, "", modelRoute(catalog.id, id));
    }
    close();
  };

  const create = () => {
    dispatch({
      type: "openNewModelForm",
    });
    if (pathname.startsWith("/interfaces")) {
      window.history.replaceState(undefined, "", interfaceRoute(catalog.id));
    }
    close();
  };

  return (
    <div className="px-6 py-4 w-64">
      {[...models.entries()].map(([k, v]) => {
        const isSelected =
          currentModel.mode === "selected" && k === currentModel.id;
        return (
          <div
            key={k}
            className={clsx(
              "text-sm cursor-pointer p-2 hover:text-gray-700 hover:bg-gray-100",
              isSelected ? "text-gray-700" : "text-gray-400"
            )}
            onClick={() => pick(k)}
          >
            <span
              className={clsx(
                "font-bold font-mono text-xs",
                isSelected || "text-gray-500"
              )}
            >
              {k}
            </span>{" "}
            <span className="font-bold">{v.author}</span>
          </div>
        );
      })}
      <div
        className={clsx(
          "text-sm cursor-pointer p-2 hover:bg-gray-100",
          "text-blue-500"
        )}
        onClick={create}
      >
        Create new model
      </div>
    </div>
  );
};

export const ModelPicker: FC = () => {
  const model = useSelectedModel();

  return (
    <Dropdown render={({ close }) => <ModelPickerMenu close={close} />}>
      <div className="border border-gray-200 p-2 rounded cursor-pointer">
        {model ? (
          <div className="text-gray-700 text-sm">Model by {model.author}</div>
        ) : (
          <div className="italic text-gray-500 text-sm">Pick a model</div>
        )}
      </div>
    </Dropdown>
  );
};
