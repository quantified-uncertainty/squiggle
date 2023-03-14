import { FC } from "react";
import { GraphEstimate } from "./GraphEstimate";
import { TextEstimate } from "./TextEstimate";
import { EstimateProps } from "./types";

export const Estimate: FC<EstimateProps> = ({ model, setModel }) => {
  switch (model.mode) {
    case "text":
      return <TextEstimate model={model} setModel={setModel} />;
    case "graph":
      return <GraphEstimate model={model} setModel={setModel} />;
  }
};
