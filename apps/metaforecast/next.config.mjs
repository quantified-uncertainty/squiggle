import path from "path";

// via https://nextjs.org/docs/pages/api-reference/config/next-config-js/output#caveats
// should help with prisma
export default {
  // this includes files from the monorepo base two directories up
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  outputFileTracingInclude: {
    "*": ["node_modules/@quri/metaforecast-db/generated/*.node"],
  },
};
