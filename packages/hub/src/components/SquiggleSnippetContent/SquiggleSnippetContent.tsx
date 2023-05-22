import { useSession } from "next-auth/react";
import { FC, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useFragment, useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

import { SquiggleChart, SquigglePlayground } from "@quri/squiggle-components";
import { Button, TextArea, useToast } from "@quri/ui";

import { SquiggleSnippetContentFragment$key } from "@/__generated__/SquiggleSnippetContentFragment.graphql";
import { SquiggleSnippetContentMutation } from "@/__generated__/SquiggleSnippetContentMutation.graphql";
import { WithTopMenu } from "@/components/layout/WithTopMenu";

const Fragment = graphql`
  fragment SquiggleSnippetContentFragment on Model {
    id
    slug
    owner {
      username
    }
    currentRevision {
      description
      content {
        __typename
        ... on SquiggleSnippet {
          code
        }
      }
    }
  }
`;

const Mutation = graphql`
  mutation SquiggleSnippetContentMutation(
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

const EditSquiggleSnippetContent: FC<{
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

  const [saveMutation] = useMutation<SquiggleSnippetContentMutation>(Mutation);

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

  return (
    <form onSubmit={save}>
      <WithTopMenu>
        <div className="max-w-2xl mx-auto">
          {session?.user.username === data.owner.username ? (
            <Button theme="primary" onClick={save} wide>
              Save
            </Button>
          ) : (
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
            />
          )}
        />
      </WithTopMenu>
    </form>
  );
};

const ViewSquiggleSnippetContent: FC<{
  model: SquiggleSnippetContentFragment$key;
}> = ({ model }) => {
  const data = useFragment(Fragment, model);

  if (data.currentRevision.content.__typename !== "SquiggleSnippet") {
    // shouldn't happen, typename is validated by ModelView
    throw new Error("Internal error");
  }

  return (
    <div>
      {data.currentRevision.description === "" ? null : (
        <div className="mb-4">
          <ReactMarkdown
            remarkPlugins={[remarkBreaks]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-2xl font-medium" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h1 className="text-xl font-bold" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h1 className="font-bold" {...props} />
              ),
            }}
          >
            {data.currentRevision.description}
          </ReactMarkdown>
        </div>
      )}
      <SquiggleChart
        code={data.currentRevision.content.code}
        environment={{
          sampleCount: 1000,
          xyPointLength: 1000,
        }}
      />
    </div>
  );
};

type Props = {
  model: SquiggleSnippetContentFragment$key;
  mode: "view" | "edit";
};

export const SquiggleSnippetContent: FC<Props> = ({ model, mode }) => {
  if (mode === "edit") {
    return <EditSquiggleSnippetContent model={model} />;
  } else {
    return <ViewSquiggleSnippetContent model={model} />;
  }
};
