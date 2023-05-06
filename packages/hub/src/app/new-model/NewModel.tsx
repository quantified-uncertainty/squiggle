"use client";
import { useState, useCallback, FC } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { SquigglePlayground } from "@quri/squiggle-components";
import { Button } from "@/components/ui/Button";
import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";

const SaveMutation = graphql`
  mutation NewModelMutation($input: MutationCreateSquiggleSnippetModelInput!) {
    createSquiggleSnippetModel(input: $input) {
      ... on CreateSquiggleSnippetResult {
        model {
          id
        }
      }
    }
  }
`;

export const NewModel: FC = () => {
  const [code, setCode] = useState("");

  const [saveMutation, isSaveInFlight] =
    useMutation<NewModelMutation>(SaveMutation);

  const save = useCallback(() => {
    saveMutation({
      variables: {
        input: {
          code,
          slug: "TODO",
        },
      },
    });
  }, [saveMutation, code]);

  return (
    <div>
      <SquigglePlayground onCodeChange={setCode} code={code} />
      <Button onClick={save}>Save</Button>
    </div>
  );
};
