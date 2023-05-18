import type { Meta, StoryObj } from "@storybook/react";

import { ColorInput } from "../../index.js";
import { withRHF } from "./withRHF.js";

const meta = { component: ColorInput } satisfies Meta<typeof ColorInput>;
export default meta;
type Story = StoryObj<typeof ColorInput>;

export const Default: Story = {
  render: withRHF((args, register) => (
    <ColorInput {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Input label",
  },
};
