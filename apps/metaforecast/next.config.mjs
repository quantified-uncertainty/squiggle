import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import path from "path";

/** @type {import('next').NextConfig} */
export default {
  // this includes files from the monorepo base two directories up
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@quri/metaforecast-db/generated/*.node"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },
};
