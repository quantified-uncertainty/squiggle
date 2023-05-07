import { FC } from "react";
import { useFragment, useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelFormFragment$key } from "@/__generated__/ModelFormFragment.graphql";
import { UserLink } from "@/components/UserLink";
import { Button } from "@/components/ui/Button";
import { SquigglePlayground } from "@quri/squiggle-components";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { DeleteModelButton } from "./DeleteModelButton";
import { ModelFormMutation } from "@/__generated__/ModelFormMutation.graphql";

const Fragment = graphql`
  fragment ModelFormFragment on Model {
    id
    slug
    owner {
      username
    }
    content {
      __typename
      ... on SquiggleSnippet {
        code
      }
    }
  }
`;

const Mutation = graphql`
  mutation ModelFormMutation($input: MutationUpdateSquiggleSnippetModelInput!) {
    result: updateSquiggleSnippetModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on UpdateSquiggleSnippetResult {
        model {
          ...ModelFormFragment
        }
      }
    }
  }
`;

type Props = {
  username: string;
  slug: string;
  model: ModelFormFragment$key;
};

export const ModelForm: FC<Props> = ({ username, slug, model }) => {
  const { data: session } = useSession();

  const data = useFragment(Fragment, model);

  const { handleSubmit, control } = useForm<{
    code: string;
  }>({
    defaultValues: {
      code:
        data.content.__typename === "SquiggleSnippet" ? data.content.code : "",
    },
  });

  const [saveMutation, isSaveInFlight] =
    useMutation<ModelFormMutation>(Mutation);

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
          // setError(data.result.message);
        } else {
          // router.push("/");
        }
      },
      onError(e) {
        // setError(e.toString());
      },
    });
  });

  const typename = data.content.__typename;
  if (typename !== "SquiggleSnippet") {
    return <div>Unknown model type {typename}</div>;
  }
  return (
    <form onSubmit={save}>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-xl font-bold">{data.slug}</span> by{" "}
            <UserLink user={data.owner} />
          </div>
          {session?.user.username === data.owner.username ? (
            <>
              <DeleteModelButton username={username} slug={slug} />
              <Button onClick={save}>Save</Button>
            </>
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
      </div>
    </form>
  );
};
