import type { Meta, StoryObj } from "@storybook/react";

import { allIconsMap, IconByName } from "../../icons/IconByName.js";

const meta = { component: IconByName } satisfies Meta<typeof IconByName>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  args: {
    name: "DocumentTextIcon",
  },
  render: ({ size }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "32px",
        justifyItems: "center",
        alignItems: "center",
      }}
    >
      {Object.keys(allIconsMap).map((name) => (
        <div key={name} style={{ textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "48px",
            }}
          >
            <IconByName name={name} size={size} />
          </div>
          <div style={{ fontSize: "12px", marginTop: "8px" }}>{name}</div>
        </div>
      ))}
    </div>
  ),
};
