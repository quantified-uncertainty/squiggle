import { builder } from "@/graphql/builder";
import { ErrorInterface } from "./common";

export class NotFoundError extends Error {
  constructor() {
    super();
  }
}

builder.objectType(NotFoundError, {
  name: "NotFoundError",
  interfaces: [ErrorInterface],
});
