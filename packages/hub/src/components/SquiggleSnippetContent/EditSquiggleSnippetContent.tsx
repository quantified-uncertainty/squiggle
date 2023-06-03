import { useSession } from "next-auth/react";
import { FC, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { graphql, useFragment, useMutation } from "react-relay";

import { SquigglePlayground } from "@quri/squiggle-components";
import { Button, TextArea, useToast } from "@quri/ui";

import { SquiggleSnippetContentFragment$key } from "@/__generated__/SquiggleSnippetContentFragment.graphql";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { Fragment } from "./SquiggleSnippetContent";
import { EditSquiggleSnippetContentMutation } from "@/__generated__/EditSquiggleSnippetContentMutation.graphql";

export const Mutation = graphql`
  mutation EditSquiggleSnippetContentMutation(
    $input: MutationUpdateSquiggleSnippetModelInput!
  ) {
    result: updateSquiggleSnippetModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on UpdateSquiggleSnippetResult {
        model {
          ...SquiggleSnippetContentFragment
        }
      }
    }
  }
`;

export const EditSquiggleSnippetContent: FC<{
  model: SquiggleSnippetContentFragment$key;
}> = ({ model }) => {
  const toast = useToast();
  const { data: session } = useSession();

  const data = useFragment(Fragment, model);

  const initialFormValues = useMemo(() => {
    if (data.currentRevision.content.__typename !== "SquiggleSnippet") {
      // shouldn't happen, typename is validated by ModelView
      throw new Error("Internal error");
    }
    return {
      code: data.currentRevision.content.code,
      description: data.currentRevision.description,
    };
  }, [data]);

  const { handleSubmit, control, register } = useForm<{
    code: string;
    description: string;
  }>({
    defaultValues: initialFormValues,
  });

  const [saveMutation] =
    useMutation<EditSquiggleSnippetContentMutation>(Mutation);

  const save = handleSubmit((formData) => {
    saveMutation({
      variables: {
        input: {
          code: formData.code,
          slug: data.slug,
          username: data.owner.username,
          description: formData.description,
        },
      },
      onCompleted(data) {
        if (data.result.__typename === "BaseError") {
          toast(data.result.message, "error");
        } else {
          toast("Saved", "confirmation");
        }
      },
      onError(e) {
        toast(e.toString(), "error");
      },
    });
  });

  const canSave = session?.user.username === data.owner.username;

  return (
    <form onSubmit={save}>
      <WithTopMenu>
        <div className="max-w-2xl mx-auto">
          {canSave ? null : (
            <div className="text-xs">
              {"You don't own this model, edits won't be saved."}
            </div>
          )}
          {session?.user.username === data.owner.username ? (
            <div className="mt-2">
              <TextArea
                register={register}
                name="description"
                label="Description"
              />
            </div>
          ) : null}
        </div>
        <Controller
          name="code"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <SquigglePlayground
              onCodeChange={field.onChange}
              code={field.value}
              renderExtraControls={() =>
                canSave ? (
                  <Button theme="primary" onClick={save} wide>
                    Save
                  </Button>
                ) : null
              }
            />
          )}
        />
      </WithTopMenu>
    </form>
  );
};
