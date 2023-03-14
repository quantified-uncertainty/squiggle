import { FormHeader } from "@/components/ui/FormHeader";
import { FC } from "react";
import { ClusterFilter } from "../ClusterFilter";
import { Axis } from "./GridViewProvider";

export const AxisFilter: FC<{ axis: Axis }> = ({ axis }) => {
  return (
    <div className="px-6 py-4 min-w-[16em]">
      <FormHeader>Clusters</FormHeader>
      <ClusterFilter axis={axis} />
    </div>
  );
};
