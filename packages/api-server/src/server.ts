import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { schema } from "./schema/index.js";

const yoga = createYoga({
  schema,
});

const server = createServer(yoga);

server.listen(3000);
