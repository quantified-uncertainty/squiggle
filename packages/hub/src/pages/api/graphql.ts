import { createYoga } from "graphql-yoga";
import { getServerSession } from "next-auth";

import { schema } from "@/graphql/schema";
import { authOptions } from "./auth/[...nextauth]";

const yoga = createYoga({
  graphqlEndpoint: "/api/graphql",
  schema,
  // req and res are not in Typescript, but they still exist:
  // https://the-guild.dev/graphql/yoga-server/docs/features/context#nodejs-standalone-express-and-nextjs-etc
  // (converting Fetch API request to Node.js request is too hard, and getServerSession wants Node.js request)
  context: async ({ req, res }: any) => {
    const session = await getServerSession(req, res, authOptions);
    return {
      session,
    };
  },
});

export default yoga;
