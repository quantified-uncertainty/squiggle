import { TextModel } from "@/model/utils";
import { SquiggleEditor } from "@quri/squiggle-components";
import { FC } from "react";
import { EstimateProps } from "./types";

export const TextModelEditor: FC<EstimateProps<TextModel>> = ({
  model,
  setModel,
}) => {
  return (
    <SquiggleEditor
      code={model.code}
      onCodeChange={(code) => setModel({ ...model, code })}
      hideViewer
    />
  );
};
