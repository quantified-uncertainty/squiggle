import { FormHeader } from "@/components/ui/FormHeader";
import { FC } from "react";
import { ClusterFilter } from "../ClusterFilter";
import { Axis } from "./GridViewProvider";

export const AxisFilter: FC<{ axis: Axis }> = ({ axis }) => {
  return (
    <div>
      <FormHeader>Clusters</FormHeader>
      <ClusterFilter axis={axis} />
    </div>
  );
};
