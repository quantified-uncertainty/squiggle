import type { Meta, StoryObj } from "@storybook/react";

import { makeSelfContainedLinker, sq } from "@quri/squiggle-lang";
import { Button } from "@quri/ui";

import { SquigglePlayground as Component } from "../components/SquigglePlayground/index.js";

/**
 * A Squiggle playground is an environment where you can play around with all settings, including sampling settings, in Squiggle.
 */
const meta: Meta<typeof Component> = {
  component: Component,
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: "Normal",
  args: {
    defaultCode: "a = normal(5,2)",
    height: 800,
  },
};

export const HeightAndScroll: Story = {
  name: "Custom height and scrollbars",
  args: {
    defaultCode:
      "List.upTo(1,10) -> map({|i| i to i + 1})" + new Array(100).join("\n"),
    height: 400,
  },
};

export const AutorunFalse: Story = {
  name: "Autorun=false",
  args: {
    autorunMode: false,
    defaultCode:
      "List.upTo(1,10) -> map({|i| i to i + 1})" + new Array(100).join("\n"),
    height: 400,
  },
};

export const Slow: Story = {
  name: "Slow Code",
  args: {
    defaultCode: "List.upTo(1,5000000) -> reduce(0,add)",
    height: 800,
  },
};

export const WithNestedResult: Story = {
  name: "Nested  Code",
  args: {
    defaultCode: `a = normal(5,2)
e = [1,2,3,4,5,6,7,8,9,10,11]
b = a + 4
c = a + 2
nested = {e: {f: {g1: a, g2: b, g3: {h: {i: a}}}}}
notNested = {a: 1, b:1, c: [1,2,3,4]}
longVar = {
  thisIsAVeryLongVariable: 3000000 to 50000000,
  thisIsAnotherLongVariable: 5000000 to 20000000,
  longer: {
    thisIsAVeryLongVariable: 355555555555555,
    thisIsAVeryLongVariable2: 300000 to 2000000000,
  }
}
g = 1
e = 3
q = 5
w = 2
    `,
    height: 800,
  },
};

export const RelativeValues: Story = {
  name: "RelativeValues plot",
  args: {
    defaultCode: `ids = ["foo", "bar"]
foo = SampleSet.fromDist(2 to 5)
bar = foo + SampleSet.fromDist(3 to 6) * 0.5
items = {
  foo: foo,
  bar: bar
}
fn = { |id1, id2|
  [items[id1], items[id2]]
}

RelativeValues.gridPlot({
  title: "My Relative Values Plot",
  ids: ids,
  fn: fn
})
`,
  },
};

export const WithExtraControls: Story = {
  name: "With extra controls",
  args: {
    defaultCode: "normal(5,2)",
    height: undefined,
    renderExtraControls: ({ openModal }) => (
      <div className="ml-2 flex h-full items-center">
        <Button size="small" onClick={() => openModal("extra")}>
          Extra modal
        </Button>
      </div>
    ),
    renderExtraModal: (name) =>
      name === "extra"
        ? {
            title: "Extra",
            body: <div>Extra content</div>,
          }
        : undefined,
  },
};

export const Comments: Story = {
  name: "With comments",
  args: {
    defaultCode: sq`/** This comment will be attached to x */
show1 = true

// Line comments won't work.
noShow1 = false

/* Block comments starting with a single star won't work either; we follow JSDoc conventions in this. */
noShow2 = false

/*** Triple stars are forbidden too; again, JSDoc convention. */
noShow2 = false

/** This comment won't show because \`show2\` is shadowed */
show2 = false

/** If variable is redefined, we attach the last comment */
show2 = true

/** line 1 */
/** line 2 - only this line will be shown */
t = 3

/** there can be any amount of space between the comment and the variable */



showFar = true

/** zero space is ok too */showNear = true

/**
Comments can be long.

# There's no markdown support yet.

Squiggle is a minimalist programming language for probabilistic estimation. It's meant for intuitively-driven quantitative estimation instead of data analysis or data-driven statistical techniques.

The basics of Squiggle are fairly straightforward. This can be enough for many models. The more advanced functionality can take some time to learn.
*/
long = true

/** dict comment */
r = {
  foo: 5,
  /** comments on static dict fields work too */
  bar: 6,
}
`,
  },
};

const linker = makeSelfContainedLinker({
  "hub:source1": `@name("my Import")
export x=1`,
  source2: `
    import "hub:source1" as s1
    export y=2
    export foo = {a: s1}
  `,
});

export const ManyTypes: Story = {
  name: "Many types",
  args: {
    linker,
    onOpenExport: (sourceId, varName) => {
      // eslint-disable-next-line no-console
      console.log("Clicked Export with params", sourceId, varName);
    },
    defaultCode: `import "hub:source1" as s1  
import "source2" as s2

varNum = 3333
varBool = true
varString = "This is a long string"

varArray = [1,2,3]
varLambda = {|e| "Test"}
varScale = Scale.symlog({ min: -2, max: 5})

@name("My favorite Dict")
@doc("This is a long description")
varDict = {fir: 1, secon: 2}

foo(t) = t

varTable = Table.make(
  {
    data: [1, 4, 5],
    columns: [
      { fn: {|e|e}, name: "Number" },
      { fn: {|e| normal(e^2, e^3)}, name: "Dist" },
      { fn: {|e|[e, e, e, e]}, name: "Array" },
      { fn: {|e|{first: e, second: e+1, third: e+2, fourth: e+3}}, name: "Dict" },
    ],
  }
)

varDist = SampleSet.fromDist(2 to 5)
export varDist2 = SampleSet.fromDist(10E20 to 20E20)

export varScatter = Plot.scatter({
  xDist: varDist,
  yDist: (1 to 3) * 5 - varDist ^ 2
})
`,
    height: 800,
  },
};

export const SpecialList: Story = {
  name: "List Notebook",
  args: {
    defaultCode: `notNotebook = [
  "### This is an opening section
Here is more text.


Here is more text.",
  Calculator({|f| f + 3}),
  "## Distributions",
  "### Distribution 1",
  normal(5, 2),
  "### Distribution 1",
  normal(20, 1),
  " ### This is an opening section
Here is more text.
",
]

notebook = notNotebook -> Tag.notebook
`,
    height: 800,
  },
};

export const Markdown: Story = {
  name: "Markdown",
  args: {
    defaultCode: `"# Header 1  
Content under first header  
## Header 2  
Stuff under the second header. 
Text continued on this line.

This is a new paragraph.

### Header 3  
Stuff under the third header  

Longer text goes here.
[link](https://google.com)
**bold** and *italics*

![image](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Dog_anatomy_lateral_skeleton_view.jpg/560px-Dog_anatomy_lateral_skeleton_view.jpg)

---

\`\`\`js
foo = 23
bar = 123
\`\`\`

\`test123\`
\`\`test123\`\`
"
`,
    height: 1200,
  },
};

export const Calculator: Story = {
  name: "Calculator",
  args: {
    defaultCode: `calculatorCorrectlyUpdatesTest = 343 //changing this should propery update the calculator
    
    f(a, b, c, d) =  [a,b,c,d,{|f| normal(f*b, f*b)}]
a = "A longer description of the calculator goes here...\n"
Calculator.make(
  {
    fn: f,
    title: "My Calculator",
    description: a,
    inputs: [
      Input.checkbox({name: "VariableCheckbox", description: "This is a long name", default: false}),
      Input.textArea({name: "Variable2", description: "This is a long name", default: "2 to 40"}),
      Input.text({name: "Variable1", description: "This is a very long description This is a very long description This is a very long description This is a very long description This is a very long description", default: 1}),
      Input.select({name: "Variable3", default: "alice", options: ["alice", "charles", "bob", "bill", "maven", "billy", "samantha", "becky"]})
    ],
    sampleCount: 1000,
    autorun: false,
  }
)
  `,
    height: 800,
  },
};

export const Tagged: Story = {
  name: "Tagged values",
  args: {
    defaultCode: `z = 34 -> Tag.format(".1f")

@startOpen
@location
s = 4 to 10

@name("My favorite Dist")
@doc("This is a long description")
@format("$.2")
x = 5 to 10

@name("My favorite Number")
@doc("This is a long description")
num = 50

@showAs(Plot.numericFn)
@name("My favorite Fn")
fn = {|e| e}

@hide
bar =  [x, fn]

@startClosed
@showAs(Plot.numericFn)
@name("My favorite Fn2")
fn2 = {|e| e} 

y = x -> Tag.getAll`,
  },
};
export const LongExample: Story = {
  name: "Long example",
  args: {
    defaultCode: `
@name("💰 Surgery Cost ($)")
@doc(
  "Includes surgery, hospital stay, PT, and follow-up care. Based on US average costs as of 2023."
)
surgeryCost = 20k to 50k

@name("🏥 Surgery Success Rate")
@doc(
  "Probability of significant improvement in mobility and pain reduction. Based on meta-analyses of similar cases."
)
@format(".0%")
successRate = beta({ mean: 0.75, stdev: 0.1 })

@name("⚕️ QALY Value ($)")
@doc("Value of one quality-adjusted life year")
qalyValue = 100k to 200k

@name("👨 Patient Age (years)")
@doc("Age of patient considering surgery. Model assumes working age adult.")
@doc(
  "Default age of 45 chosen as typical for this surgery type. Based on medical literature."
)
initialAge = 45
patientAge = if initialAge < 18 then throw(
  "Patient age must be at least 18"
) else if initialAge > 90 then throw(
  "Patient age must be under 90"
) else initialAge

@name("⏳ Years of Benefit")
@doc("Expected years of benefit if surgery is successful")
yearsBenefit = 85 - patientAge -> {|years| normal(years, years / 10)}

@name("🏃‍♂️ Quality of Life Improvement")
@doc("QALY improvement per year if successful")
@format(".0%")
qalyImprovement = beta({ mean: 0.15, stdev: 0.05 })

@name("Expected Value Calculation")
expectedValue = {
  totalQALYs = yearsBenefit * qalyImprovement * successRate
  benefitValue = totalQALYs * qalyValue
  netBenefit = benefitValue - surgeryCost
  { totalQALYs, benefitValue, netBenefit }
}
`,
  },
};
export const StartOpen: Story = {
  name: "StartOpen",
  args: {
    defaultCode: `@startOpen
@name("Documentation")
documentation = "
# SquiggleJest Testing Library

SquiggleJest is a simple testing library for Squiggle, inspired by Jest for JavaScript. It provides a way to write and run tests for your Squiggle models and functions.
"

var2 = 1
var3 = 3
var4 = 4
var5 = 5
var6 = 6
var7 = 7
var8 = 8
var9 = 9
var10 = 10
var11 = 11
`,
  },
};

export const Specification: Story = {
  name: "Specification",
  args: {
    defaultCode: `validate(fn) = {
      errors = List.upTo(2020, 2030)
        -> List.map(
          {|e| [Date(e), typeOf(fn(Date(e))) == "Distribution"]}
        )
        -> List.filter(
          {|e| true}
        )
      "Has errors!"
    }
    
    spec = Spec.make(
      {
        name: "Stock market over time",
        documentation: "Stock market over time",
        validate: validate,
      }
    )
    
    fn(t: [Date(2020), Date(2030)]) = {
      yearsDiff = toYears(t - Date(2020))
      normal(yearsDiff, yearsDiff + 0.1)
    }
    
    withSpec = fn -> Tag.spec(spec)
  `,
  },
};

export const WithProfiler: Story = {
  args: {
    defaultCode: `x = 5 // fast
y = List.upTo(1, 1000) -> map({|v| v + 1 }) -> List.length // slow
`,
    environment: {
      profile: true,
    },
  },
};
