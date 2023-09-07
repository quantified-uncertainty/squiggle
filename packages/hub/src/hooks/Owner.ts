// Imported from a random mutation; Relay doesn't generate input types by itself (TODO: maybe there's a relay-compiler flag for that?)
import { OwnerInput } from "@/__generated__/DeleteModelActionMutation.graphql";
import { Owner$key } from "@/__generated__/Owner.graphql";

import { graphql, useFragment } from "react-relay";

const fragment = graphql`
  fragment Owner on Owner {
    __typename
    slug
  }
`;

// This hook is used a lot by components that don't own the Owner fragment.
// The reason for this is that `Owner$data` is passed to `routes.ts` functions.
// If we passed `Owner$key` instead, we'd have to turn all routes functions into hooks, and that
// would be inconveinent and sometimes impossible.
export function useOwner(ownerRef: Owner$key) {
  return useFragment(fragment, ownerRef);
}

export function useOwnerForInput(ownerRef: Owner$key): OwnerInput {
  const owner = useFragment(fragment, ownerRef);

  switch (owner.__typename) {
    case "User":
      return { username: owner.slug };
    case "Group":
      return { groupSlug: owner.slug };
    default:
      throw new Error(`Unknown typename ${owner.__typename}`);
  }
}
