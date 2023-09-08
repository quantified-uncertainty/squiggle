import { ZodError, ZodIssue } from "zod";
import { builder } from "../builder";
import { ErrorInterface } from "./common";

const ValidationErrorIssue = builder
  .objectRef<ZodIssue>("ValidationErrorIssue")
  .implement({
    fields: (t) => ({
      message: t.exposeString("message"),
      path: t.stringList({
        resolve: (obj) => obj.path.map((item) => String(item)),
      }),
    }),
  });

builder.objectType(ZodError, {
  name: "ValidationError",
  interfaces: [ErrorInterface],
  // TODO - patch ZodError.message to be human-readable
  fields: (t) => ({
    issues: t.field({
      type: [ValidationErrorIssue],
      resolve: (obj) => obj.issues,
    }),
    message: t.string({
      resolve: (obj) => {
        return obj.issues
          .map((issue) => `[${issue.path.join(".")}] ${issue.message}`)
          .join("\n");
      },
    }),
  }),
});
