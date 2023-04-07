import { useSelectedModel } from "@/app/interfaces/[id]/models/[modelId]/ModelProvider";
import { modelRoute, newModelRoute, useSiblingRoute } from "@/routes";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { Dropdown } from "../ui/Dropdown";
import { useSelectedInterface } from "./InterfaceProvider";

const ModelPickerMenu: FC<{ close(): void }> = ({ close }) => {
  const { models, catalog } = useSelectedInterface();
  const selectedModel = useSelectedModel();
  const selectedId = selectedModel?.id;

  const router = useRouter();

  const siblingRoute = useSiblingRoute();

  const pick = (id: string) => {
    const newRoute = siblingRoute(id);
    console.log(newRoute);
    if (newRoute) {
      router.push(newRoute);
    }
    close();
  };

  return (
    <div className="px-6 py-4 w-64">
      {[...models.entries()].map(([k, v]) => {
        const isSelected = k === selectedId;
        return (
          <div
            key={k}
            className={clsx(
              "text-sm cursor-pointer p-2 hover:text-gray-700 hover:bg-gray-100",
              isSelected ? "text-gray-700" : "text-gray-400"
            )}
            onClick={() => pick(k)}
          >
            <div
              className={clsx(
                "font-bold font-mono text-xs",
                isSelected || "text-gray-500"
              )}
            >
              {v.title}
            </div>
            <div className="font-bold">{v.author}</div>
          </div>
        );
      })}
      <Link href={newModelRoute(catalog.id)} onClick={close}>
        <div
          className={clsx(
            "text-sm cursor-pointer p-2 hover:bg-gray-100",
            "text-blue-500"
          )}
        >
          Create new model
        </div>
      </Link>
    </div>
  );
};

export const ModelPicker: FC = () => {
  const selectedModel = useSelectedModel();

  return (
    <Dropdown render={({ close }) => <ModelPickerMenu close={close} />}>
      <div className="border border-gray-200 p-2 rounded cursor-pointer">
        {selectedModel ? (
          <div className="text-gray-700 text-sm">Unselect</div>
        ) : (
          <div className="italic text-gray-500 text-sm">Pick an estimate</div>
        )}
      </div>
    </Dropdown>
  );
};
