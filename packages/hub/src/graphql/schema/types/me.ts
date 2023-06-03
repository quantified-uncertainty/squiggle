import { builder } from "@/graphql/builder";

export const Me = builder.simpleObject("Me", {
  fields: (t) => ({
    email: t.string({ nullable: true }), // TODO - guarantee in NextAuth configuration? check and throw?
    username: t.string({ nullable: true }),
  }),
});
