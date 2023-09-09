"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { Button, TextFormField, useToast } from "@quri/ui";

import { ChooseUsernameMutation } from "@gen/ChooseUsernameMutation.graphql";
import { SlugFormField } from "@/components/ui/SlugFormField";

const Mutation = graphql`
  mutation ChooseUsernameMutation($username: String!) {
    setUsername(username: $username) {
      __typename
      ... on BaseError {
        message
      }
      ... on Me {
        email
      }
    }
  }
`;

export const ChooseUsername: FC = () => {
  const toast = useToast();

  type FormShape = {
    username: string;
  };

  const form = useForm<FormShape>({
    mode: "onChange",
  });

  const router = useRouter();

  const { data: session, update: updateSession } = useSession({
    required: true,
  });
  if (session?.user.username) {
    router.replace("/");
  }

  const [mutation, inFlight] = useMutation<ChooseUsernameMutation>(Mutation);

  const save = form.handleSubmit((data) => {
    mutation({
      variables: { username: data.username },
      onCompleted(data) {
        if (data.setUsername.__typename === "BaseError") {
          toast(data.setUsername.message, "error");
        } else {
          updateSession();
          router.replace("/");
        }
      },
      onError(error) {
        toast((error as any).source ?? error.toString(), "error");
      },
    });
  });

  const disabled = inFlight || !form.formState.isValid;

  return (
    <form onSubmit={save}>
      <FormProvider {...form}>
        <div className="flex flex-col items-center mt-20">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <SlugFormField<FormShape>
                placeholder="Username"
                name="username"
                label="Pick a username"
                size="small"
              />
              <Button onClick={save} disabled={disabled} theme="primary">
                Save
              </Button>
            </div>
          </div>
        </div>
      </FormProvider>
    </form>
  );
};
