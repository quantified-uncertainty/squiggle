// see https://pothos-graphql.dev/docs/guide/generating-client-types#export-schema-in-a-js-file,
// but we use ts-node instead of @boost/module
require("ts-node").register({});

module.exports = require("./schema/index.ts");
