import { Prisma } from "@prisma/client";
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";

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

// Rethrows Prisma constraint error (usually happens on create operations) with a nicer error message.
export async function rethrowOnConstraint<T>(
  cb: () => Promise<T>,
  ...handlers: {
    target: string[];
    error: string;
  }[]
): Promise<T> {
  try {
    return await cb();
  } catch (e) {
    for (const handler of handlers) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        Array.isArray(e.meta?.["target"]) &&
        e.meta?.["target"].join(",") === handler.target.join(",")
      ) {
        // TODO - throw more specific error
        // TODO - should this even be an ActionError? `handler.error` is still not very readable
        throw new ActionError(handler.error);
      }
    }
    throw e;
  }
}
