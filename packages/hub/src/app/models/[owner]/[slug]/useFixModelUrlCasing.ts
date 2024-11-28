import { usePathname, useRouter } from "next/navigation";

import { patchModelRoute } from "@/routes";
import { ModelCardData } from "@/server/models/data";

export function useFixModelUrlCasing(model: ModelCardData) {
  const router = useRouter();
  const pathname = usePathname();

  const patchedPathname = patchModelRoute({
    pathname,
    slug: model.slug,
    owner: model.owner.slug,
  });
  if (
    patchedPathname &&
    patchedPathname !== pathname &&
    typeof window !== "undefined"
  ) {
    // delay to avoid React warnings
    window.setTimeout(() => {
      router.replace(patchedPathname);
    }, 0);
  }
}
