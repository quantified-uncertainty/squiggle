import { hooks_useIsGroupAdmin$key } from "@/__generated__/hooks_useIsGroupAdmin.graphql";
import { hooks_useIsGroupMember$key } from "@/__generated__/hooks_useIsGroupMember.graphql";
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

export function useIsGroupMember(groupRef: hooks_useIsGroupMember$key) {
  const { myMembership } = useFragment(
    graphql`
      fragment hooks_useIsGroupMember on Group {
        myMembership {
          id
        }
      }
    `,
    groupRef
  );
  return Boolean(myMembership);
}
