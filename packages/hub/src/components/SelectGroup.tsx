"use client";
import { FC } from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { useRelayEnvironment } from "react-relay";
import { OptionProps, SingleValueProps, components } from "react-select";
import AsyncSelect from "react-select/async";
import { fetchQuery, graphql } from "relay-runtime";

import { ControlledFormField } from "@quri/ui";

import {
  SelectGroupQuery,
  SelectGroupQuery$data,
} from "@/__generated__/SelectGroupQuery.graphql";

const Query = graphql`
  query SelectGroupQuery($input: GroupsQueryInput!) {
    groups(input: $input) {
      edges {
        node {
          id
          slug
        }
      }
    }
  }
`;

type Option = SelectGroupQuery$data["groups"]["edges"][number]["node"];

const GroupInfo: FC<{ group: Option }> = ({ group }) => <div>{group.slug}</div>;

const Option = ({ children, ...props }: OptionProps<Option>) => {
  return (
    <components.Option {...props}>
      <GroupInfo group={props.data} />
    </components.Option>
  );
};

const SingleValue = ({
  children,
  ...props
}: SingleValueProps<Option, false>) => {
  return (
    <components.SingleValue {...props}>
      <GroupInfo group={props.data} />
    </components.SingleValue>
  );
};

export function SelectGroup<
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
    const result = await fetchQuery<SelectGroupQuery>(environment, Query, {
      input: {
        slugContains: inputValue,
        myOnly,
      },
    }).toPromise();

    if (!result) {
      return [];
    }

    return result.groups.edges.map((edge) => edge.node);
  };

  return (
    <ControlledFormField name={name} label={label} rules={{ required }}>
      {({ onChange }) => (
        <AsyncSelect
          components={{ SingleValue, Option }}
          loadOptions={loadOptions}
          defaultOptions
          isClearable={!required}
          onChange={(group) => onChange(group?.slug)}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 100 }) }}
          menuPortalTarget={document.body}
        />
      )}
    </ControlledFormField>
  );
}
