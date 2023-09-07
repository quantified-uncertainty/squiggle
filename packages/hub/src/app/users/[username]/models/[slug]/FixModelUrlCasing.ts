import { usePathname, useRouter } from "next/navigation";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { patchModelRoute } from "@/routes";
import { FixModelUrlCasing$key } from "@/__generated__/FixModelUrlCasing.graphql";
import { useOwner } from "@/hooks/Owner";

export const FixModelUrlCasingFragment = graphql`
  fragment FixModelUrlCasing on Model {
    id
    slug
    owner {
      ...Owner
    }
  }
`;

export function useFixModelUrlCasing(modelRef: FixModelUrlCasing$key) {
  const router = useRouter();
  const pathname = usePathname();
  const model = useFragment(FixModelUrlCasingFragment, modelRef);
  const owner = useOwner(model.owner);

  const patchedPathname = patchModelRoute({
    pathname,
    slug: model.slug,
    owner,
  });
  if (patchedPathname && patchedPathname !== pathname) {
    router.replace(patchedPathname);
  }
}
