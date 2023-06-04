import Skeleton from "react-loading-skeleton";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";

export default function Loading() {
  return (
    <FullLayoutWithPadding>
      <Skeleton count={10} height={24} />
    </FullLayoutWithPadding>
  );
}
