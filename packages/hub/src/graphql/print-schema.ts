import { writeFileSync } from "fs";
import { lexicographicSortSchema, printSchema } from "graphql";
import path from "path";

import { schema } from "./schema";

const schemaAsString = printSchema(lexicographicSortSchema(schema));

writeFileSync(path.join(__dirname, "../../schema.graphql"), schemaAsString);
