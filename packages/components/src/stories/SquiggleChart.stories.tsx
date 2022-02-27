import * as React from 'react'
import { SquiggleChart } from './SquiggleChart'

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/SquiggleChart',
  component: SquiggleChart
}

const Template = ({squiggleString}) => <SquiggleChart squiggleString={squiggleString} />

export const Default = Template.bind({})
Default.args = {
  squiggleString: "normal(5, 2)"
};
