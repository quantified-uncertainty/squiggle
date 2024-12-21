import { GroupIcon, UserCircleIcon } from "@quri/ui";

export function ownerIcon(typename: string) {
  switch (typename) {
    case "User":
      return UserCircleIcon;
    case "Group":
      return GroupIcon;
    default:
      throw new Error("Expected User or Group");
  }
}
