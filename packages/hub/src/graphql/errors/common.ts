import { builder } from "@/graphql/builder";
import { Prisma } from "@prisma/client";

export const ErrorInterface = builder.interfaceRef<Error>("Error").implement({
  fields: (t) => ({
    message: t.exposeString("message"),
  }),
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
        Array.isArray(e.meta?.target) &&
        e.meta?.target.join(",") === handler.target.join(",")
      ) {
        // TODO - throw more specific error
        throw new Error(handler.error);
      }
    }
    throw e;
  }
}
