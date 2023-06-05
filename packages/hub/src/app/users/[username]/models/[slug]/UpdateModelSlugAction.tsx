import { UpdateModelSlugActionMutation } from "@/__generated__/UpdateModelSlugActionMutation.graphql";
import { modelRoute } from "@/routes";
import {
  Button,
  DropdownMenuActionItem,
  DropdownMenuAsyncActionItem,
  EditIcon,
  Modal,
  TextInput,
  TrashIcon,
  useToast,
} from "@quri/ui";
import { useRouter } from "next/navigation";
import { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

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
  username: string;
  slug: string;
  close(): void; // close is used by Modal and by Action, but has different meaning (it's just a coincidence that signature is the same)
};

const UpdateModelSlugModal: FC<Props> = ({ username, slug, close }) => {
  const router = useRouter();
  const toast = useToast();

  const { register, handleSubmit } = useForm<{ slug: string }>();
  const [mutation] = useMutation<UpdateModelSlugActionMutation>(Mutation);

  const save = handleSubmit((data) => {
    mutation({
      variables: { input: { username, oldSlug: slug, newSlug: data.slug } },
      onCompleted(response) {
        if (response.result.__typename === "BaseError") {
          toast(response.result.message, "error");
        } else {
          router.push(modelRoute({ username, slug: data.slug }));
          close();
        }
      },
      onError(e) {
        toast(e.toString(), "error");
      },
    });
  });

  return (
    <Modal close={close}>
      <Modal.Header>
        Rename {username}/{slug}
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          Are you sure? All existing links to the model will break.
        </div>
        <TextInput register={register} name="slug" label="New slug" />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={save} theme="primary">
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export const UpdateModelSlugAction: FC<Props> = ({ username, slug, close }) => {
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
        <UpdateModelSlugModal
          slug={slug}
          username={username}
          close={closeModal}
        />
      )}
    </>
  );
};
