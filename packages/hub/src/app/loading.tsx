import Skeleton from "react-loading-skeleton";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";

export default function Loading() {
  return (
    <NarrowPageLayout>
      <Skeleton count={10} height={24} />
    </NarrowPageLayout>
  );
}
