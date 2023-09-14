"use client";
import { FC } from "react";
import { FieldPathByValue, FieldValues } from "react-hook-form";
import { useRelayEnvironment } from "react-relay";
import { fetchQuery, graphql } from "relay-runtime";

import { SelectFormField } from "@quri/ui";

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

// Note: we can't wrap this in a fragment because it's not possible to call `useFragment`
// in SelectFormField callbacks.
export type SelectOwnerOption = {
  __typename: "User" | "Group";
  id: string;
  slug: string;
};

const OwnerInfo: FC<{ owner: SelectOwnerOption }> = ({ owner }) => {
  const Icon = ownerIcon(owner.__typename);
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-slate-500" size={16} />
      <div>{owner.slug}</div>
    </div>
  );
};

export function SelectOwner<
  TValues extends FieldValues,
  TName extends FieldPathByValue<
    TValues,
    SelectOwnerOption | null
  > = FieldPathByValue<TValues, SelectOwnerOption | null>,
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

  const loadOptions = async (
    inputValue: string
  ): Promise<SelectOwnerOption[]> => {
    const result = await fetchQuery<SelectOwnerQuery>(environment, Query, {
      search: inputValue,
      myOnly,
    }).toPromise();

    if (!result) {
      return [];
    }

    const options: SelectOwnerOption[] = [];
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
    <SelectFormField<TValues, SelectOwnerOption | null>
      name={name}
      label={label}
      required={required}
      async
      loadOptions={loadOptions}
      renderOption={(owner) => <OwnerInfo owner={owner} />}
      getOptionValue={(owner) => owner.id}
    />
  );
}
