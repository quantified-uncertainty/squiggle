import SchemaBuilder from "@pothos/core";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";

export const builder = new SchemaBuilder({
  plugins: [SimpleObjectsPlugin],
});

builder.queryType({});
