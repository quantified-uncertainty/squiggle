import { writeFileSync } from "fs";
import { lexicographicSortSchema, printSchema } from "graphql";

import { schema } from "./schema/index.js";

const schemaAsString = printSchema(lexicographicSortSchema(schema));

writeFileSync("schema.graphql", schemaAsString);
