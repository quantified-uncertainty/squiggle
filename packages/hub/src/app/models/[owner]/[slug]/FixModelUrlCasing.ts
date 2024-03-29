import { usePathname, useRouter } from "next/navigation";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { patchModelRoute } from "@/routes";

import { FixModelUrlCasing$key } from "@/__generated__/FixModelUrlCasing.graphql";

export const FixModelUrlCasingFragment = graphql`
  fragment FixModelUrlCasing on Model {
    id
    slug
    owner {
      slug
    }
  }
`;

export function useFixModelUrlCasing(modelRef: FixModelUrlCasing$key) {
  const router = useRouter();
  const pathname = usePathname();
  const model = useFragment(FixModelUrlCasingFragment, modelRef);

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
