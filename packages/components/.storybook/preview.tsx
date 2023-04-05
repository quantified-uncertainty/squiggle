import * as React from "react";

import "../src/styles/main.css";
import { SquiggleContainer } from "../src/components/SquiggleContainer";

export const decorators = [
  (Story) => (
    <SquiggleContainer>
      <Story />
    </SquiggleContainer>
  ),
];

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
