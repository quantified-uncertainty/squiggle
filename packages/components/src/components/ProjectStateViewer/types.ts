import { ReactNode } from "react";

export type NodeData = {
  label: ReactNode;
  tooltip?: () => ReactNode;
  className?: string;
  noTargetHandle?: boolean;
  noSourceHandle?: boolean;
};
