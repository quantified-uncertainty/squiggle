import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import Skeleton from "react-loading-skeleton";

export default function Loading() {
  return (
    <NarrowPageLayout>
      <Skeleton count={10} height={24} />
    </NarrowPageLayout>
  );
}
