"use client";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { SquigglePlayground } from "@quri/squiggle-components";
import { Button, TextInput } from "@quri/ui";

import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";
import { useSession } from "next-auth/react";
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

  const { register, handleSubmit, control } = useForm<{
    code: string;
    slug: string;
  }>();

  const router = useRouter();

  const [error, setError] = useState("");

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
          setError(data.result.message);
        } else {
          router.push("/");
        }
      },
      onError(e) {
        setError(e.toString());
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
            {error && <div className="text-xs">{error}</div>}
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
