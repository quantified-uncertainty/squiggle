import { hooks_useIsGroupAdmin$key } from "@/__generated__/hooks_useIsGroupAdmin.graphql";
import { graphql, useFragment } from "react-relay";

export function useIsGroupAdmin(groupRef: hooks_useIsGroupAdmin$key) {
  const { myMembership } = useFragment(
    graphql`
      fragment hooks_useIsGroupAdmin on Group {
        myMembership {
          id
          role
        }
      }
    `,
    groupRef
  );
  return myMembership?.role === "Admin";
}
