import { usePathname, useRouter } from "next/navigation";

import { patchModelRoute } from "@/routes";
import { ModelCardDTO } from "@/server/models/data/card";

export function useFixModelUrlCasing(model: ModelCardDTO) {
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
