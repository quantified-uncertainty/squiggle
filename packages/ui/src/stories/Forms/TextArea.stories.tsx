import type { Meta, StoryObj } from "@storybook/react";

import { TextArea } from "../../index.js";
import { withRHF } from "./withRHF.js";

const meta = { component: TextArea } satisfies Meta<typeof TextArea>;
export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  render: withRHF((args, { register }) => (
    <TextArea {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Label",
    placeholder: "Placeholder...",
  },
};
