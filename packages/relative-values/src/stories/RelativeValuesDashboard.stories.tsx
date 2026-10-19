import type { Meta, StoryObj } from "@storybook/react";

import healthCode from "../../examples/health-interventions.squiggle?raw";
import minimalCode from "../../examples/minimal.squiggle?raw";
import quriCode from "../../examples/quri.squiggle?raw";
import { ExampleDashboard } from "./ExampleDashboard.js";

const meta: Meta<typeof ExampleDashboard> = {
  component: ExampleDashboard,
};
export default meta;

type Story = StoryObj<typeof ExampleDashboard>;

export const Quri: Story = {
  args: { code: quriCode },
};

export const QuriGrid: Story = {
  args: { code: quriCode, initialTab: "grid" },
};

export const QuriPlot: Story = {
  args: { code: quriCode, initialTab: "plot" },
};

export const HealthInterventions: Story = {
  args: { code: healthCode },
};

export const Minimal: Story = {
  args: { code: minimalCode },
};

export const InvalidSpec: Story = {
  args: {
    code: `spec = { items: ["a", "b"], values: { a: 1, c: 2 } }`,
  },
};
