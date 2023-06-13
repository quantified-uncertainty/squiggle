"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { SquigglePlayground } from "@quri/squiggle-components";
import { Button, TextAreaFormField, TextFormField, useToast } from "@quri/ui";

import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";
import { WithTopMenu } from "@/components/layout/WithTopMenu";

const Mutation = graphql`
  mutation NewModelMutation($input: MutationCreateSquiggleSnippetModelInput!) {
    result: createSquiggleSnippetModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on CreateSquiggleSnippetResult {
        model {
          id
        }
      }
    }
  }
`;

export const NewModel: FC = () => {
  useSession({ required: true });

  const toast = useToast();

  const form = useForm<{
    code: string;
    slug: string;
    description: string;
  }>({
    defaultValues: {
      code: `/*
Describe your code here
*/

a = normal(2, 5)`,
    },
  });

  const router = useRouter();

  const [saveMutation, isSaveInFlight] =
    useMutation<NewModelMutation>(Mutation);

  const save = form.handleSubmit((data) => {
    saveMutation({
      variables: {
        input: {
          code: data.code,
          slug: data.slug,
          description: data.description,
        },
      },
      onCompleted(data) {
        if (data.result.__typename === "BaseError") {
          toast(data.result.message, "error");
        } else {
          router.push("/");
        }
      },
      onError(e) {
        toast(e.toString(), "error");
      },
    });
  });

  return (
    <form onSubmit={save}>
      <FormProvider {...form}>
        <div className="max-w-2xl mx-auto">
          <div className="font-bold text-xl mb-4">New model</div>
          <div className="space-y-2 mb-4">
            <TextFormField
              name="slug"
              description="Must be alphanumerical, with no spaces. Example: my-long-model"
              label="Model Name"
              placeholder="my-model"
              rules={{
                pattern: {
                  value: /^[\w-]+$/,
                  message:
                    "Must be alphanumerical, with no spaces. Example: my-long-model",
                },
                required: true,
              }}
            />
          </div>
          <Button onClick={save} disabled={isSaveInFlight} theme="primary">
            Save
          </Button>
        </div>
      </FormProvider>
    </form>
  );
};
