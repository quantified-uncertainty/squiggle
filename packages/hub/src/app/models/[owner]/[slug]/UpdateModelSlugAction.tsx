import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import {
  Button,
  DropdownMenuActionItem,
  EditIcon,
  Modal,
  TextFormField,
  useToast,
} from "@quri/ui";

import { UpdateModelSlugActionMutation } from "@/__generated__/UpdateModelSlugActionMutation.graphql";
import { modelRoute } from "@/routes";

const Mutation = graphql`
  mutation UpdateModelSlugActionMutation(
    $input: MutationUpdateModelSlugInput!
  ) {
    result: updateModelSlug(input: $input) {
      __typename
      ... on BaseError {
        message
      }
    }
  }
`;

type Props = {
  owner: string;
  slug: string;
  close(): void; // close is used by Modal and by Action, but has different meaning (it's just a coincidence that signature is the same)
};

const UpdateModelSlugModal: FC<Props> = ({ owner, slug, close }) => {
  const router = useRouter();
  const toast = useToast();

  const form = useForm<{ slug: string }>({
    mode: "onChange",
    defaultValues: {
      slug,
    },
  });
  const [mutation, mutationInFlight] =
    useMutation<UpdateModelSlugActionMutation>(Mutation);

  const save = form.handleSubmit((data) => {
    mutation({
      variables: {
        input: { owner, oldSlug: slug, newSlug: data.slug },
      },
      onCompleted(response) {
        if (response.result.__typename === "BaseError") {
          toast(response.result.message, "error");
        } else {
          router.push(modelRoute({ owner, slug: data.slug }));
          close();
        }
      },
      onError(e) {
        toast(e.toString(), "error");
      },
    });
  });

  return (
    <FormProvider {...form}>
      <Modal close={close}>
        <Modal.Header>
          Rename {owner}/{slug}
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            Are you sure? All existing links to the model will break.
          </div>
          <TextFormField
            name="slug"
            label="New slug"
            rules={{
              pattern: {
                value: /^[\w-]+$/,
                message: "Must be alphanumerical",
              },
              required: true,
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={save}
            theme="primary"
            disabled={!form.formState.isValid || mutationInFlight}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </FormProvider>
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
