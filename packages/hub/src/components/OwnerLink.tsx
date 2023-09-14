import { FC } from "react";

import { OwnerLinkFragment$key } from "@/__generated__/OwnerLinkFragment.graphql";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { GroupLink } from "./GroupLink";
import { UsernameLink } from "./UsernameLink";

export const OwnerLinkFragment = graphql`
  fragment OwnerLinkFragment on Owner {
    __typename
    id
    slug
  }
`;

export const OwnerLink: FC<{ ownerRef: OwnerLinkFragment$key }> = ({
  ownerRef,
}) => {
  const owner = useFragment(OwnerLinkFragment, ownerRef);
  switch (owner.__typename) {
    case "User":
      return <UsernameLink username={owner.slug} />;
    case "Group":
      return <GroupLink slug={owner.slug} />;
    default:
      throw new Error(`Unknown owner type ${owner.__typename}`);
  }
};
