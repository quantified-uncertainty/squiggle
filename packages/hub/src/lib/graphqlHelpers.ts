import { notFound } from "next/navigation";

type ErrorUnionNode<OkTypename extends string, Content> =
  | {
      readonly __typename: "BaseError";
      readonly message: string;
    }
  | {
      readonly __typename: "NotFoundError";
      readonly message: string;
    }
  | {
      readonly __typename: "%other";
    }
  | ({
      readonly __typename: OkTypename;
    } & Content)
  | null; // useful when node is obtained through top-level `node { ... }`

/*
 * This function will render 404 on NotFoundError and throw on other errors;
 * Otherwise, it will extract the value for a given typename.
 *
 * Note: implementation is not very type-safe.
 * Maybe because `OkTypename` can overlap with other `__typename` values?
 * I tried to do `OkTypename extends "BaseError" ? never : OkTypename`, but it didn't help.
 */
export function extractFromGraphqlErrorUnion<
  OkTypename extends string,
  Content,
>(node: ErrorUnionNode<OkTypename, Content>, typename: OkTypename) {
  if (node === null || node.__typename === "NotFoundError") {
    notFound();
  }
  if (node.__typename === "BaseError") {
    throw new Error(
      // somehow Typescript fails to infer this
      (
        node as { readonly __typename: "BaseError"; readonly message: string }
      ).message
    );
  }
  if (node.__typename !== typename) {
    throw new Error("Unexpected typename");
  }

  return node as { readonly __typename: OkTypename } & Content;
}
