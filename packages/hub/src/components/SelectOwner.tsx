"use client";
import { FC } from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { useRelayEnvironment } from "react-relay";
import { OptionProps, SingleValueProps, components } from "react-select";
import AsyncSelect from "react-select/async";
import { fetchQuery, graphql } from "relay-runtime";

import { ControlledFormField } from "@quri/ui";

import { SelectOwnerQuery } from "@/__generated__/SelectOwnerQuery.graphql";
import { ownerIcon } from "@/lib/ownerIcon";

const Query = graphql`
  query SelectOwnerQuery($search: String!, $myOnly: Boolean!) {
    me @include(if: $myOnly) {
      asUser {
        __typename
        id
        slug
      }
    }
    users(input: { usernameContains: $search }) @skip(if: $myOnly) {
      edges {
        node {
          __typename
          id
          slug
        }
      }
    }
    groups(input: { slugContains: $search, myOnly: $myOnly }) {
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
  readonly __typename: "User" | "Group";
  readonly id: string;
  readonly slug: string;
};

const OwnerInfo: FC<{ owner: Option }> = ({ owner }) => {
  const Icon = ownerIcon(owner.__typename);
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-slate-500" size={16} />
      <div>{owner.slug}</div>
    </div>
  );
};

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
  myOnly = false,
}: {
  name: TName;
  label?: string;
  required?: boolean;
  myOnly?: boolean;
}) {
  const environment = useRelayEnvironment();

  const loadOptions = async (inputValue: string): Promise<Option[]> => {
    const result = await fetchQuery<SelectOwnerQuery>(environment, Query, {
      search: inputValue,
      myOnly,
    }).toPromise();

    if (!result) {
      return [];
    }

    const options: Option[] = [];
    if (result.me) {
      options.push(result.me.asUser);
    }
    if (result.users) {
      options.push(...(result.users.edges.map((edge) => edge.node) ?? []));
    }
    options.push(...result.groups.edges.map((edge) => edge.node));
    return options;
  };

  return (
    <ControlledFormField name={name} label={label} rules={{ required }}>
      {({ onChange }) => (
        <AsyncSelect
          components={{ SingleValue, Option }}
          loadOptions={loadOptions}
          defaultOptions
          onChange={(owner) => onChange(owner?.slug)}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 100 }) }}
          menuPortalTarget={document.body}
        />
      )}
    </ControlledFormField>
  );
}
