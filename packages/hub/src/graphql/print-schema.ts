import path from "path";
import { writeFileSync } from "fs";
import { lexicographicSortSchema, printSchema } from "graphql";
import { schema } from "./schema";

const schemaAsString = printSchema(lexicographicSortSchema(schema));

writeFileSync(path.join(__dirname, "../../schema.graphql"), schemaAsString);
