import { builder } from "../builder";
import { MembershipRoleType } from "./Group";

export const GroupInvite = builder.prismaInterface("GroupInvite", {
  fields: (t) => ({
    id: t.exposeID("id"),
    group: t.relation("group"),
    role: t.field({
      type: MembershipRoleType,
      resolve: (t) => t.role,
    }),
  }),
  resolveType: (invite) => {
    if (invite.userId) {
      return "UserGroupInvite";
    } else if (invite.email) {
      return "EmailGroupInvite";
    } else {
      throw new Error("Invalid invite object");
    }
  },
});

builder.prismaNode("GroupInvite", {
  variant: "UserGroupInvite",
  interfaces: [GroupInvite],
  id: { field: "id" },
  fields: (t) => ({
    user: t.relation("user"),
  }),
});

builder.prismaNode("GroupInvite", {
  variant: "EmailGroupInvite",
  interfaces: [GroupInvite],
  id: { field: "id" },
  fields: (t) => ({
    email: t.exposeString("email", {
      // Pothos workaround because we guarantee that email invites have non-null email values
      nullable: false as any,
    }),
  }),
});

export const GroupInviteConnection = builder.connectionObject({
  type: GroupInvite,
  name: "GroupInviteConnection",
});
