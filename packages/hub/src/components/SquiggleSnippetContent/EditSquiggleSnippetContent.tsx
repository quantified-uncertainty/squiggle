import { useSession } from "next-auth/react";
import { FC, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { graphql, useFragment, useMutation } from "react-relay";

import { SquigglePlayground } from "@quri/squiggle-components";
import { Button, TextArea, useToast } from "@quri/ui";

import { EditSquiggleSnippetContentMutation } from "@/__generated__/EditSquiggleSnippetContentMutation.graphql";
import { ModelPageBody$key } from "@/__generated__/ModelPageBody.graphql";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { SquiggleSnippetContentFragment } from "./SquiggleSnippetContent";
import { SquiggleSnippetContent$key } from "@/__generated__/SquiggleSnippetContent.graphql";
import { ModelPageBodyFragment } from "@/app/users/[username]/models/[slug]/ModelPageBody";

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
          ...ModelPage
        }
      }
    }
  }
`;

type Props = {
  // We have to pass the entire model here and not just content;
  // it's too hard to split the editing form into "content-type-specific" part and "generic model fields" part.
  modelRef: ModelPageBody$key;
};

export const EditSquiggleSnippetContent: FC<Props> = ({ modelRef }) => {
  const toast = useToast();
  const { data: session } = useSession();

  const model = useFragment(ModelPageBodyFragment, modelRef);
  const content = useFragment<SquiggleSnippetContent$key>(
    SquiggleSnippetContentFragment,
    model.currentRevision.content
  );

  const initialFormValues = useMemo(() => {
    return {
      code: content.code,
      description: model.currentRevision.description,
    };
  }, [model, content]);

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
          slug: model.slug,
          username: model.owner.username,
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

  const canSave = session?.user.username === model.owner.username;

  return (
    <form onSubmit={save}>
      <WithTopMenu>
        <div className="max-w-2xl mx-auto">
          {canSave ? null : (
            <div className="text-xs">
              {"You don't own this model, edits won't be saved."}
            </div>
          )}
          {session?.user.username === model.owner.username ? (
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
