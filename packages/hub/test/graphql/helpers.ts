import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { ExecutionResult, print } from "graphql";
import { createYoga } from "graphql-yoga";
import { Session } from "next-auth";

import { schema } from "@/graphql/schema";
import { prisma } from "@/prisma";

let currentUser: Session["user"] | null;

// Useful when you need a custom email or to create a user without username.
// In other cases, `setCurrentUser` function below is more convenient.
export async function setCurrentUserObject(user: {
  email: string;
  username?: string;
}) {
  await prisma.user.upsert({
    where: {
      email: user.email,
    },
    create: {
      email: user.email,
      ...(user.username
        ? {
            asOwner: {
              create: {
                slug: user.username,
              },
            },
          }
        : {}),
    },
    update: {},
  });
  currentUser = user;
}

export async function setCurrentUser(username: string) {
  await setCurrentUserObject({
    email: `${username}@example.com`,
    username,
  });
}

export async function unsetCurrentUser() {
  currentUser = null;
}

beforeEach(unsetCurrentUser);

const yoga = createYoga({
  schema,
  context: async () => {
    const session: Session | null = currentUser
      ? {
          user: currentUser,
          expires: "mock",
        }
      : null;
    return { session };
  },
});

// Note: buildHTTPExecutor from @graphql-tools/executor-http, as described in
// https://the-guild.dev/graphql/yoga-server/docs/features/testing, might be more flexible,
// but its executor returns an MaybeAsyncIterable that's hard to unpack.
export async function executeOperation<TResult, TVariables>(
  operation: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables
): Promise<NonNullable<ExecutionResult<TResult>["data"]>> {
  const response = await Promise.resolve(
    yoga.fetch("http://yoga/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: print(operation),
        variables: variables ?? undefined,
      }),
    })
  );
  const yogaResponse = await response.json();

  if (!yogaResponse.data) {
    throw new Error("No data");
  }
  return yogaResponse.data;
}

type CommonResult = {
  // see also: `useAsyncMutation` hook
  readonly result: {
    readonly __typename: string;
  };
};

export async function executeCommonOperation<
  TResult extends CommonResult,
  const TExpectedTypename extends string,
  TVariables,
>(
  operation: TypedDocumentNode<TResult, TVariables>,
  options: {
    variables?: TVariables;
    expectedTypename: TExpectedTypename;
  }
): Promise<
  Extract<TResult["result"], { readonly __typename: TExpectedTypename }>
> {
  const { result } = await executeOperation<TResult, TVariables>(
    operation,
    options.variables
  );

  if (result.__typename === options.expectedTypename) {
    // we want to return a result before "BaseError" check, because it's valid for the test to expect an error
    return result as Extract<
      TResult["result"],
      { readonly __typename: TExpectedTypename }
    >;
  }

  if (result.__typename === "BaseError") {
    throw new Error(
      (result as { message?: string })?.message ??
        `Typename mismatch: ${result.__typename}`
    );
  }

  throw new Error(`Unexpected result: ${result.__typename}`);
}

// returns two wrappers on top of executeCommonOperation
export function createRunners<
  TResult extends CommonResult,
  const TExpectedTypename extends string,
  TVariables,
>(
  mutation: TypedDocumentNode<TResult, TVariables>,
  expectedTypename: TExpectedTypename
) {
  const runOk = async (variables: TVariables) => {
    return await executeCommonOperation(mutation, {
      variables,
      expectedTypename,
    });
  };

  const runError = async <T extends string>(
    variables: TVariables,
    typename: T
  ) => {
    return await executeCommonOperation(mutation, {
      variables,
      expectedTypename: typename,
    });
  };

  return { runOk, runError };
}

// common convenient speicalization of createRunners - functions accept input instead of variables
export function createInputRunners<
  TResult extends CommonResult,
  const TExpectedTypename extends string,
  TInput,
>(
  mutation: TypedDocumentNode<TResult, { input: TInput }>,
  expectedTypename: TExpectedTypename
) {
  const { runOk, runError } = createRunners(mutation, expectedTypename);
  return {
    runOk: (input: TInput) => runOk({ input }),
    runError: <T extends string>(input: TInput, typename: T) =>
      runError({ input }, typename),
  };
}
