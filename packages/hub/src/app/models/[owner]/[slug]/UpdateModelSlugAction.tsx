import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { graphql } from "relay-runtime";

import { DropdownMenuActionItem, EditIcon } from "@quri/ui";

import { UpdateModelSlugActionMutation } from "@/__generated__/UpdateModelSlugActionMutation.graphql";
import { FormModal } from "@/components/ui/FormModal";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { modelRoute } from "@/routes";

const Mutation = graphql`
  mutation UpdateModelSlugActionMutation(
    $input: MutationUpdateModelSlugInput!
  ) {
    result: updateModelSlug(input: $input) {
      __typename
      ... on Error {
        message
      }
      ... on UpdateModelSlugResult {
        model {
          id
          slug
        }
      }
    }
  }
`;

type Props = {
  owner: string;
  slug: string;
  // close is used by Modal and by Action, but has different meaning (it's just a coincidence that signature is the same)
  close(): void;
};

const UpdateModelSlugModal: FC<Props> = ({ owner, slug, close }) => {
  const router = useRouter();

  type FormShape = { slug: string };

  const form = useForm<FormShape>({
    mode: "onChange",
    defaultValues: { slug },
  });
  const [mutation, inFlight] = useAsyncMutation<UpdateModelSlugActionMutation>({
    mutation: Mutation,
    expectedTypename: "UpdateModelSlugResult",
  });

  const save = form.handleSubmit((data) => {
    mutation({
      variables: {
        input: { owner, oldSlug: slug, newSlug: data.slug },
      },
      onCompleted() {
        router.push(modelRoute({ owner, slug: data.slug }));
        close(); // shouldn't matter
      },
    });
  });

  useEffect(() => {
    form.setFocus("slug");
  }, [form]);

  return (
    <FormModal
      close={close}
      title={`Rename ${owner}/${slug}`}
      submitText="Save"
      form={form}
      onSubmit={save}
      inFlight={inFlight}
    >
      <div className="mb-4">
        Are you sure? All existing links to the model will break.
      </div>
      <SlugFormField<FormShape> name="slug" label="New slug" />
    </FormModal>
  );
};

export const UpdateModelSlugAction: FC<Props> = ({ owner, slug, close }) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = close; // closing the dropdown is enough, since this component will be destroyed

  return (
    <>
      <DropdownMenuActionItem
        title="Rename"
        onClick={() => setIsOpen(true)}
        icon={EditIcon}
      />
      {isOpen && (
        <UpdateModelSlugModal slug={slug} owner={owner} close={closeModal} />
      )}
    </>
  );
};
