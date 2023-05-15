import { Button, TextInput } from "@quri/ui";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { ChooseUsernameMutation } from "@gen/ChooseUsernameMutation.graphql";
import { useForm } from "react-hook-form";

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
  const [error, setError] = useState<string | undefined>();

  const { register, handleSubmit, watch } = useForm<{
    username: string;
  }>();

  const router = useRouter();

  const { data: session } = useSession({ required: true });
  if (session?.user.username) {
    router.push("/");
  }

  const [mutation, isMutationInFlight] =
    useMutation<ChooseUsernameMutation>(Mutation);

  const save = handleSubmit((data) => {
    mutation({
      variables: { username: data.username },
      onCompleted(data) {
        if (data.setUsername.__typename === "BaseError") {
          setError(data.setUsername.message);
        } else {
          router.replace("/");
        }
      },
      onError(error) {
        setError((error as any).source ?? error.toString());
      },
    });
  });

  const disabled = isMutationInFlight || !watch("username");

  return (
    <div className="flex flex-col items-center mt-20">
      <div className="space-y-2">
        <div>Pick a username:</div>
        <div className="flex items-center gap-1">
          <TextInput
            placeholder="Username"
            register={register}
            name="username"
          />
          <Button onClick={save} disabled={disabled}>
            Save
          </Button>
        </div>
        {error && (
          <div className="text-xs text-red-700 max-w-lg font-mono">{error}</div>
        )}
      </div>
    </div>
  );
};
