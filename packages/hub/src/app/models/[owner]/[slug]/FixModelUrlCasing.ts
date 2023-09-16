import { usePathname, useRouter } from "next/navigation";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { FixModelUrlCasing$key } from "@/__generated__/FixModelUrlCasing.graphql";
import { patchModelRoute } from "@/routes";

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
  if (patchedPathname && patchedPathname !== pathname) {
    router.replace(patchedPathname);
  }
}
