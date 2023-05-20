"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { SquigglePlayground } from "@quri/squiggle-components";
import { Button, TextInput, useToast } from "@quri/ui";

import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { useSession } from "next-auth/react";

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

  const { register, handleSubmit, control } = useForm<{
    code: string;
    slug: string;
  }>();

  const router = useRouter();

  const [saveMutation, isSaveInFlight] =
    useMutation<NewModelMutation>(Mutation);

  const save = handleSubmit((data) => {
    saveMutation({
      variables: {
        input: {
          code: data.code,
          slug: data.slug,
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
      <WithTopMenu>
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl">New model</div>
          <div className="flex items-center gap-2">
            <TextInput
              register={register}
              name="slug"
              placeholder="Slug"
              size="small"
            />
            <Button onClick={save} disabled={isSaveInFlight} theme="primary">
              Save
            </Button>
          </div>
        </div>
        <Controller
          name="code"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SquigglePlayground
              onCodeChange={field.onChange}
              code={field.value}
            />
          )}
        />
      </WithTopMenu>
    </form>
  );
};
