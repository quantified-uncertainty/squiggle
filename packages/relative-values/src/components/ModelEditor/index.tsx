import { FC } from "react";
import { GraphModelEditor } from "./GraphModelEditor";
import { TextModelEditor } from "./TextModelEditor";
import { EstimateProps } from "./types";

export const InnerModelEditor: FC<EstimateProps> = ({ model, setModel }) => {
  switch (model.mode) {
    case "text":
      return <TextModelEditor model={model} setModel={setModel} />;
    case "graph":
      return <GraphModelEditor model={model} setModel={setModel} />;
  }
};

export const ModelEditor: FC<EstimateProps> = (props) => {
  return (
    <div>
      <div className="text-xs italic mb-2">
        Changes aren&apos;t saved automatically. Use the &quot;Save&quot; button
        above to export interface data as JSON.
      </div>
      <InnerModelEditor {...props} />
    </div>
  );
};
