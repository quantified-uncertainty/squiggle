import { useSession } from "next-auth/react";
import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useFragment, useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { SquigglePlayground } from "@quri/squiggle-components";
import { Button, DotsHorizontalIcon, Dropdown, DropdownMenu } from "@quri/ui";

import { SquiggleSnippetFormFragment$key } from "@/__generated__/SquiggleSnippetFormFragment.graphql";
import { SquiggleSnippetFormMutation } from "@/__generated__/SquiggleSnippetFormMutation.graphql";
import { ModelInfo } from "@/components/ModelInfo";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";
import { modelRevisionsRoute } from "@/routes";
import { DeleteModelAction } from "./DeleteModelAction";

const Fragment = graphql`
  fragment SquiggleSnippetFormFragment on SquiggleSnippet {
    id
    code
  }
`;

const Mutation = graphql`
  mutation SquiggleSnippetFormMutation(
    $input: MutationUpdateSquiggleSnippetModelInput!
  ) {
    result: updateSquiggleSnippetModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on UpdateSquiggleSnippetResult {
        model {
          currentRevision {
            content {
              ...SquiggleSnippetFormFragment
            }
          }
        }
      }
    }
  }
`;

type Props = {
  username: string;
  slug: string;
  content: SquiggleSnippetFormFragment$key;
};

export const SquiggleSnippetForm: FC<Props> = ({ username, slug, content }) => {
  const { data: session } = useSession();

  const data = useFragment(Fragment, content);

  const [error, setError] = useState("");

  const { handleSubmit, control } = useForm<{ code: string }>({
    defaultValues: { code: data.code },
  });

  const [saveMutation, isSaveInFlight] =
    useMutation<SquiggleSnippetFormMutation>(Mutation);

  const save = handleSubmit((formData) => {
    saveMutation({
      variables: {
        input: {
          code: formData.code,
          slug,
          username,
        },
      },
      onCompleted(data) {
        if (data.result.__typename === "BaseError") {
          setError(data.result.message);
        } else {
          setError("");
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
        <div className="flex items-baseline gap-4">
          <ModelInfo slug={slug} username={username} />
          {session?.user.username === username ? (
            <div className="flex items-center gap-2">
              <Button theme="primary" onClick={save}>
                Save
              </Button>
              <Dropdown
                render={({ close }) => (
                  <DropdownMenu>
                    <DropdownMenuLinkItem
                      href={modelRevisionsRoute({ username, slug })}
                      title="Revisions"
                    />
                    <DeleteModelAction
                      username={username}
                      slug={slug}
                      close={close}
                    />
                  </DropdownMenu>
                )}
                tailwindSelector="squiggle-hub"
              >
                <Button>
                  <DotsHorizontalIcon className="text-slate-500" />
                </Button>
              </Dropdown>
            </div>
          ) : (
            <div className="text-xs">
              {"You don't own this model, edits won't be saved."}
            </div>
          )}
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
