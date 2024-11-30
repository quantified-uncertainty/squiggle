import { Prisma } from "@prisma/client";
import { z } from "zod";

export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends object
    ? DeepReadonlyObject<T>
    : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export function makeServerAction<T, R>(
  schema: z.ZodType<T>,
  handler: (input: T) => Promise<R>
) {
  return async (
    data: DeepReadonly<T> // data type is unknown/unsafe, but we will validate it immediately
  ) => {
    const input = schema.parse(data);
    return handler(input);
  };
}

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
        throw new Error(handler.error);
      }
    }
    throw e;
  }
}
