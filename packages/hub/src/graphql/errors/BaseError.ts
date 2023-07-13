import { builder } from "@/graphql/builder";
import { ErrorInterface } from "./common";

// This error is a default, always available when `errors: {}` is enabled.
// See also: https://pothos-graphql.dev/docs/plugins/errors#recommended-usage
builder.objectType(Error, {
  name: "BaseError",
  interfaces: [ErrorInterface],
});
