import * as React from 'react'
import { SquiggleChart } from './SquiggleChart'

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/SquiggleChart',
  component: SquiggleChart
}

export const Default = () => <SquiggleChart squiggleString="normal(5, 2)" />
