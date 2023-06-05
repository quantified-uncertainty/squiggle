import type { Meta, StoryObj } from "@storybook/react";

import { NumberInput } from "../../index.js";
import { withRHF } from "./withRHF.js";

const meta = { component: NumberInput } satisfies Meta<typeof NumberInput>;
export default meta;
type Story = StoryObj<typeof NumberInput>;

export const Default: Story = {
  render: withRHF((args, { register }) => (
    <NumberInput {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Input label",
  },
};

export const Small: Story = {
  render: withRHF((args, { register }) => (
    <NumberInput {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Small input label",
    size: "small",
  },
};
