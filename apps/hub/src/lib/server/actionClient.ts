import { Prisma } from "@prisma/client";
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
  returnValidationErrors,
  ValidationErrors,
} from "next-safe-action";
import { z } from "zod";

export class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);

    if (e instanceof ActionError) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

// Converts Prisma constraint error (usually happens on create operations) to next-safe-action validation error.
// This allows us to attach the error to the form field that caused the error.
// The constraint must be known - if the constraint happens on a field that wasn't provided in the configuration, it will be thrown as a generic server-side error (and hidden in production).
export async function failValidationOnConstraint<T, S extends z.ZodType>(
  cb: () => Promise<T>,
  // This configuration is a bit verbose because it's the most generic form: it supports multiple possible constraints, with multiple handlers.
  // A complicated "create" operation could, theoretically, have multiple ways to fail uniqueness, and we'd need to report different fields for each.
  {
    schema,
    handlers,
  }: {
    schema: S;
    handlers: {
      // Which field or a combination of fields caused the error.
      // For example, if the error happens on a unique constraint on `slug` and `ownerId`, the constraint should be `["slug", "ownerId"]`.
      constraint: string[];
      // Action's input field name that will be reported in the validation error.
      // Must be a key on the action's input schema.
      // Nested keys are not supported.
      input: keyof z.input<S>;
      // Error message to report.
      error: string;
    }[];
  }
): Promise<T> {
  try {
    return await cb();
  } catch (e) {
    for (const handler of handlers) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        Array.isArray(e.meta?.["target"]) &&
        e.meta?.["target"].join(",") === handler.constraint.join(",")
      ) {
        returnValidationErrors(schema, {
          [handler.input]: {
            _errors: [handler.error],
          },
        } as ValidationErrors<z.input<S>>);
      }
    }
    throw e;
  }
}
