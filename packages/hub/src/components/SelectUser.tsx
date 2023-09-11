"use client";
import { FC } from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { OptionProps, SingleValueProps, components } from "react-select";
import AsyncSelect from "react-select/async";
import { fetchQuery, graphql } from "relay-runtime";

import { ControlledFormField } from "@quri/ui";

import {
  SelectUserQuery,
  SelectUserQuery$data,
} from "@/__generated__/SelectUserQuery.graphql";
import { useRelayEnvironment } from "react-relay";

const Query = graphql`
  query SelectUserQuery($input: UsersQueryInput!) {
    users(input: $input) {
      edges {
        node {
          id
          username
        }
      }
    }
  }
`;

type Option = SelectUserQuery$data["users"]["edges"][number]["node"];

const UserInfo: FC<{ user: Option }> = ({ user }) => <div>{user.username}</div>;

const Option = ({ children, ...props }: OptionProps<Option>) => {
  return (
    <components.Option {...props}>
      <UserInfo user={props.data} />
    </components.Option>
  );
};

const SingleValue = ({
  children,
  ...props
}: SingleValueProps<Option, false>) => {
  return (
    <components.SingleValue {...props}>
      <UserInfo user={props.data} />
    </components.SingleValue>
  );
};

export function SelectUser<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  label,
  required = true,
}: {
  name: TName;
  label?: string;
  required?: boolean;
}) {
  const environment = useRelayEnvironment();

  const loadOptions = async (inputValue: string): Promise<Option[]> => {
    const result = await fetchQuery<SelectUserQuery>(environment, Query, {
      input: {
        usernameContains: inputValue,
      },
    }).toPromise();

    if (!result) {
      return [];
    }

    return result.users.edges.map((edge) => edge.node);
  };

  return (
    <ControlledFormField name={name} label={label} rules={{ required }}>
      {({ onChange }) => (
        <AsyncSelect
          components={{ SingleValue, Option }}
          loadOptions={loadOptions}
          onChange={(user) => onChange(user?.username)}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 100 }) }}
          menuPortalTarget={document.body}
        />
      )}
    </ControlledFormField>
  );
}
