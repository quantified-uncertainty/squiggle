"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { graphql } from "relay-runtime";

import { Button } from "@quri/ui";

import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";
import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { modelRoute, userModelRoute } from "@/routes";
import { SelectGroup } from "@/components/SelectGroup";

const Mutation = graphql`
  mutation NewModelMutation($input: MutationCreateSquiggleSnippetModelInput!) {
    result: createSquiggleSnippetModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on CreateSquiggleSnippetModelResult {
        model {
          id
          slug
        }
      }
    }
  }
`;

const defaultCode = `/*
Describe your code here
*/

a = normal(2, 5)
`;

type FormShape = {
  slug: string | undefined;
  groupSlug: string | undefined;
};

export const NewModel: FC = () => {
  const { data: session } = useSession({ required: true });

  const form = useForm<FormShape>({
    defaultValues: {
      // don't pass `slug: ""` here, it will lead to form reset if a user started to type in a value before JS finished loading
    },
    mode: "onChange",
  });

  const router = useRouter();

  const [runMutation, inFlight] = useAsyncMutation<
    NewModelMutation,
    "CreateSquiggleSnippetModelResult"
  >({
    mutation: Mutation,
    expectedTypename: "CreateSquiggleSnippetModelResult",
    blockOnSuccess: true,
  });

  const save = form.handleSubmit(async (data) => {
    await runMutation({
      variables: {
        input: {
          slug: data.slug ?? "", // shouldn't happen but satisfies Typescript
          groupSlug: data.groupSlug,
          code: defaultCode,
        },
      },
      onCompleted: (result) => {
        const username = session?.user?.username;
        if (username) {
          router.push(
            modelRoute({
              owner: data.groupSlug ?? username,
              slug: result.model.slug,
            })
          );
        } else {
          router.push("/");
        }
      },
    });
  });

  return (
    <form onSubmit={save}>
      <FormProvider {...form}>
        <H1>New Model</H1>
        <div className="mb-4 space-y-4">
          <SlugFormField<FormShape>
            name="slug"
            example="my-long-model"
            label="Model Name"
            placeholder="my-model"
          />
          <SelectGroup<FormShape>
            label="Group"
            name="groupSlug"
            required={false}
          />
        </div>
        <Button
          onClick={save}
          disabled={!form.formState.isValid || inFlight}
          theme="primary"
        >
          Create
        </Button>
      </FormProvider>
    </form>
  );
};
