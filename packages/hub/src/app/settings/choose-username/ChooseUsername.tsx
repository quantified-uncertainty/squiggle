import { useSession } from "next-auth/react";
import { FC, useState } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { Button } from "@/components/ui/Button";
import { ChooseUsernameMutation } from "@gen/ChooseUsernameMutation.graphql";

const Mutation = graphql`
  mutation ChooseUsernameMutation($username: String!) {
    setUsername(username: $username) {
      ... on Me {
        email
      }
    }
  }
`;

export const ChooseUsername: FC = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | undefined>();

  useSession({
    required: true,
  });

  const [mutation, isMutationInFlight] =
    useMutation<ChooseUsernameMutation>(Mutation);

  const onSave = () => {
    mutation({
      variables: {
        username,
      },
      onCompleted: console.log, // TODO
      onError(error) {
        setError((error as any).source ?? error.toString());
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-20">
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
  );
};
