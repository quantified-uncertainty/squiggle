import React, { FC } from "react";
import { BaseEdge, BezierEdge, EdgeProps } from "reactflow";

export const CustomEdge: FC<EdgeProps> = (props) => {
  // we are using the default bezier edge when source and target ids are different
  if (props.source !== props.target) {
    return <BezierEdge {...props} />;
  }

  const { sourceX, sourceY, targetX, targetY, markerEnd } = props;
  const radiusX = 80;
  const radiusY = (sourceY - targetY) * 0.8;
  const edgePath = `M ${sourceX} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${targetX} ${targetY}`;

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      label="circular"
      labelX={sourceX + radiusX * 1.8}
      labelY={(sourceY + targetY) / 2}
      style={{ stroke: "#f00" }}
    />
  );
};
