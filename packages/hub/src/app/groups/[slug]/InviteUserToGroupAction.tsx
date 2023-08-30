import { InviteUserToGroupActionMutation } from "@/__generated__/InviteUserToGroupActionMutation.graphql";
import { MembershipRole } from "@/__generated__/SetMembershipRoleActionMutation.graphql";
import { SelectUser } from "@/components/SelectUser";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import {
  Button,
  ControlledFormField,
  DropdownMenuActionItem,
  Modal,
} from "@quri/ui";
import { FC, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FaPlus } from "react-icons/fa";
import Select from "react-select";
import { graphql } from "relay-runtime";

const Mutation = graphql`
  mutation InviteUserToGroupActionMutation(
    $input: MutationInviteUserToGroupInput!
  ) {
    result: inviteUserToGroup(input: $input) {
      __typename
      ... on BaseError {
        message
      }
    }
  }
`;

const InviteUserToGroupModal: FC<{
  close: () => void;
  groupSlug: string;
}> = ({ close, groupSlug }) => {
  const [runMutation, inFlight] =
    useAsyncMutation<InviteUserToGroupActionMutation>({
      mutation: Mutation,
      expectedTypename: "InviteUserToGroupResult",
    });

  type FormShape = { username: string; role: MembershipRole };

  const form = useForm<FormShape>({
    defaultValues: {
      role: "Member",
    },
  });

  const submit = form.handleSubmit(async (data) => {
    await runMutation({
      variables: {
        input: {
          group: groupSlug,
          username: data.username,
          role: data.role,
        },
      },
    });
    close();
  });

  return (
    <FormProvider {...form}>
      <Modal close={close}>
        <Modal.Header>Add relative values export</Modal.Header>
        <Modal.Body>
          <div className="space-y-2">
            <SelectUser label="Username" name="username" />
            <ControlledFormField name="role" label="Role">
              {({ value, onChange }) => (
                <Select
                  value={{ label: value, value }}
                  options={["Member", "Admin"].map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={(option) => onChange(option?.value)}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 100 }) }}
                  menuPortalTarget={document.body}
                />
              )}
            </ControlledFormField>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={submit}
            theme="primary"
            disabled={!form.formState.isValid || inFlight}
          >
            Invite
          </Button>
        </Modal.Footer>
      </Modal>
    </FormProvider>
  );
};

type Props = {
  groupSlug: string;
  close: () => void;
};

export const InviteUserToGroupAction: FC<Props> = ({ groupSlug, close }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <DropdownMenuActionItem
        title="Invite"
        icon={FaPlus}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && <InviteUserToGroupModal groupSlug={groupSlug} close={close} />}
    </>
  );
};
