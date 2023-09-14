// eslint-disable-next-line import/no-extraneous-dependencies
import { type CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema.graphql",
  documents: ["test/graphql/**/*.ts"],
  generates: {
    "./test/gql-gen/": {
      preset: "client-preset",
    },
  },
};

export default config;
