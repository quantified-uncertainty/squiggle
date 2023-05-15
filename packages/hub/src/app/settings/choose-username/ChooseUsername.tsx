import { Button } from "@quri/ui";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { ChooseUsernameMutation } from "@gen/ChooseUsernameMutation.graphql";

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
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | undefined>();

  const router = useRouter();

  const { data: session } = useSession({ required: true });
  if (session?.user.username) {
    router.push("/");
  }

  const [mutation, isMutationInFlight] =
    useMutation<ChooseUsernameMutation>(Mutation);

  const onSave = () => {
    mutation({
      variables: {
        username,
      },
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
  };

  return (
    <div className="flex flex-col items-center mt-20">
      <div className="space-y-2">
        <div>Pick a username:</div>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="username"
            className="px-2 py-1 border rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button onClick={onSave} disabled={isMutationInFlight || !username}>
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
