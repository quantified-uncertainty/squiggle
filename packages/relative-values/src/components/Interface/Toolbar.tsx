import { modelToJSON } from "@/model/utils";
import { FC, useState } from "react";
import { Button } from "../ui/Button";
import { useSelectedInterface } from "./InterfaceProvider";

const SaveButton: FC = () => {
  const [isCopied, setIsCopied] = useState(false);

  const context = useSelectedInterface();

  const copy = () => {
    const jsonContext = {
      ...context,
      models: [...context.models.entries()].map(([k, v]) => [
        k,
        modelToJSON(v),
      ]),
    };

    navigator.clipboard.writeText(JSON.stringify(jsonContext));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={copy} className="w-30">
        {isCopied ? (
          <span className="text-xs">Saved to clipboard!</span>
        ) : (
          "Export"
        )}
      </Button>
    </div>
  );
};

export const Toolbar: FC = () => {
  return (
    <div className="flex items-center gap-2">
      <SaveButton />
    </div>
  );
};
