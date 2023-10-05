import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { DropdownMenuHeader, GroupIcon, PlusIcon } from "@quri/ui";

import { MyGroupsMenu$key } from "@/__generated__/MyGroupsMenu.graphql";
import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { groupRoute, newGroupRoute } from "@/routes";

type Props = {
  groupsRef: MyGroupsMenu$key;
  close: () => void;
};

export const MyGroupsMenu: FC<Props> = ({ groupsRef, close }) => {
  const groups = useFragment(
    graphql`
      fragment MyGroupsMenu on Query {
        result: groups(input: { myOnly: true }) {
          edges {
            node {
              id
              slug
            }
          }
        }
      }
    `,
    groupsRef
  );
  return (
    <>
      <DropdownMenuHeader>My Groups</DropdownMenuHeader>

      {groups.result.edges.length ? (
        <>
          {groups.result.edges.map((edge) => (
            <DropdownMenuNextLinkItem
              key={edge.node.id}
              href={groupRoute({ slug: edge.node.slug })}
              icon={GroupIcon}
              title={edge.node.slug}
              close={close}
            />
          ))}
        </>
      ) : null}
      <DropdownMenuNextLinkItem
        href={newGroupRoute()}
        icon={PlusIcon}
        title="New Group"
        close={close}
      />
      {/* TODO: "...show all" link is hasNextPage is true */}
    </>
  );
};
