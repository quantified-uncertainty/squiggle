"use client";
import { FC } from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { OptionProps, SingleValueProps, components } from "react-select";
import AsyncSelect from "react-select/async";
import { fetchQuery, graphql } from "relay-runtime";

import { ControlledFormField } from "@quri/ui";

import { SelectOwnerQuery } from "@/__generated__/SelectOwnerQuery.graphql";
import { useRelayEnvironment } from "react-relay";

const Query = graphql`
  query SelectOwnerQuery(
    $usersInput: UsersQueryInput!
    $groupsInput: GroupsQueryInput!
  ) {
    users(input: $usersInput) {
      edges {
        node {
          __typename
          id
          slug
        }
      }
    }
    groups(input: $groupsInput) {
      edges {
        node {
          __typename
          id
          slug
        }
      }
    }
  }
`;

type Option = {
  readonly __typename: string;
  readonly id: string;
  readonly slug: string;
};

const OwnerInfo: FC<{ owner: Option }> = ({ owner }) => (
  <div>{owner.slug}</div> // TODO - show User/Group type (icon?)
);

const Option = ({ children, ...props }: OptionProps<Option>) => {
  return (
    <components.Option {...props}>
      <OwnerInfo owner={props.data} />
    </components.Option>
  );
};

const SingleValue = ({
  children,
  ...props
}: SingleValueProps<Option, false>) => {
  return (
    <components.SingleValue {...props}>
      <OwnerInfo owner={props.data} />
    </components.SingleValue>
  );
};

export function SelectOwner<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
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
    const result = await fetchQuery<SelectOwnerQuery>(environment, Query, {
      usersInput: {
        usernameContains: inputValue,
      },
      groupsInput: {
        slugContains: inputValue,
      },
    }).toPromise();

    if (!result) {
      return [];
    }

    return [
      ...result.users.edges.map((edge) => edge.node),
      ...result.groups.edges.map((edge) => edge.node),
    ];
  };

  return (
    <ControlledFormField name={name} label={label} rules={{ required }}>
      {({ onChange }) => (
        <AsyncSelect
          components={{ SingleValue, Option }}
          loadOptions={loadOptions}
          onChange={(owner) => onChange(owner?.slug)}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 100 }) }}
          menuPortalTarget={document.body}
        />
      )}
    </ControlledFormField>
  );
}
