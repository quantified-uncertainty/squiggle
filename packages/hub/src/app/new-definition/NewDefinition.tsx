"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { Button, TextInput, useToast } from "@quri/ui";

import { NewDefinitionMutation } from "@/__generated__/NewDefinitionMutation.graphql";

const Mutation = graphql`
  mutation NewDefinitionMutation(
    $input: MutationCreateRelativeValuesDefinitionInput!
  ) {
    result: createRelativeValuesDefinition(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on CreateRelativeValuesDefinitionResult {
        definition {
          id
        }
      }
    }
  }
`;

export const NewDefinition: FC = () => {
  useSession({ required: true });

  const toast = useToast();

  const { register, handleSubmit, control } = useForm<{
    slug: string;
    title: string;
    items: { id: string }[];
  }>();

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    name: "items",
    control,
  });

  const router = useRouter();

  const [saveMutation, isSaveInFlight] =
    useMutation<NewDefinitionMutation>(Mutation);

  const save = handleSubmit((data) => {
    saveMutation({
      variables: {
        input: {
          slug: data.slug,
          title: data.title,
          items: data.items,
        },
      },
      onCompleted(data) {
        if (data.result.__typename === "BaseError") {
          toast(data.result.message, "error");
        } else {
          router.push("/");
        }
      },
      onError(e) {
        toast(e.toString(), "error");
      },
    });
  });

  return (
    <form onSubmit={save}>
      <div className="max-w-2xl mx-auto">
        <div className="font-bold text-xl mb-4">
          New Relative Values definition
        </div>
        <div className="space-y-2">
          <TextInput register={register} name="slug" label="Slug" />
          <TextInput register={register} name="title" label="Title" />
          <header>Items</header>
          <div className="space-y-2">
            <div className="space-y-2">
              {itemFields.map((item, i) => (
                <div key={i}>
                  <TextInput register={register} name={`items.${i}.id`} />
                </div>
              ))}
            </div>
            <Button onClick={() => appendItem({ id: "" })}>Add item</Button>
          </div>
          <Button onClick={save} disabled={isSaveInFlight} theme="primary">
            Save
          </Button>
        </div>
      </div>
    </form>
  );
};
