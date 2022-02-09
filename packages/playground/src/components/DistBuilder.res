open ReForm
open Antd.Grid

module FormConfig = %lenses(
  type state = {
    squiggleString: string,
    sampleCount: string,
    outputXYPoints: string,
    downsampleTo: string,
    kernelWidth: string,
    diagramStart: string,
    diagramStop: string,
    diagramCount: string,
  }
)

type options = {
  sampleCount: int,
  outputXYPoints: int,
  downsampleTo: option<int>,
  kernelWidth: option<float>,
  diagramStart: float,
  diagramStop: float,
  diagramCount: int,
}

module Form = ReForm.Make(FormConfig)

module FieldText = {
  @react.component
  let make = (~field, ~label) => <>
    <Form.Field
      field
      render={({handleChange, error, value, validate}) =>{
        Js.Console.log(CodeEditor.make);
        (<CodeEditor value onChange={r => handleChange(r)} />)
      }
      }
    />
  </>
}
module FieldString = {
  @react.component
  let make = (~field, ~label) =>
    <Form.Field
      field
      render={({handleChange, error, value, validate}) =>
        <Antd.Form.Item label={label}>
          <Antd.Input
            value onChange={ReForm.Helpers.handleChange(handleChange)} onBlur={_ => validate()}
          />
        </Antd.Form.Item>}
    />
}

module FieldFloat = {
  @react.component
  let make = (~field, ~label, ~className=CssJs.style(. [])) =>
    <Form.Field
      field
      render={({handleChange, error, value, validate}) =>
          <Antd.Form.Item label={label}>
            <Antd.Input
              value
              onChange={ReForm.Helpers.handleChange(handleChange)}
              onBlur={_ => validate()}
              className={className}
            />
          </Antd.Form.Item>
        }
    />
}

module Styles = {
  open CssJs
  let rows = style(. [
    selector(. ">.antCol:firstChild", [ paddingLeft(em(0.25)), paddingRight(em(0.125)) ]),
    selector(. ">.antCol:lastChild", [ paddingLeft(em(0.125)), paddingRight(em(0.25)) ]),
    selector(. 
      ">.antCol:not(:firstChild):not(:lastChild)",
      [ paddingLeft(em(0.125)), paddingRight(em(0.125)) ],
    ),
  ])
let parent = style(. [ selector(. ".antInputNumber", [ width(#percent(100.)) ]),
selector(. ".anticon", [ verticalAlign(#zero) ]),
 ])
  let form = style(. [ backgroundColor(hex("eee")), padding(em(1.)) ])
  let dist = style(. [ padding(em(1.)) ])
  let spacer = style(. [ marginTop(em(1.)) ])
  let groupA = style(. [ selector(. ".antInputNumberInput", [ backgroundColor(hex("fff7db")) ]),
])
let groupB = style(. [ selector(. ".antInputNumberInput", [ backgroundColor(hex("eaf4ff")) ]),
 ])
}

module DemoDist = {
  @react.component
  let make = (~squiggleString: string, ~options) =>
    <Antd.Card title={"Distribution"}>
      <div>
        {switch options {
        | Some(options) =>
          let inputs1 = ForetoldAppSquiggle.ProgramEvaluator.Inputs.make(
            ~samplingInputs={
              sampleCount: Some(options.sampleCount),
              outputXYPoints: Some(options.outputXYPoints),
              kernelWidth: options.kernelWidth,
              shapeLength: Some(options.downsampleTo |> E.O.default(1000)),
            },
            ~squiggleString,
            ~environment=[
              ("K", #SymbolicDist(#Float(1000.0))),
              ("M", #SymbolicDist(#Float(1000000.0))),
              ("B", #SymbolicDist(#Float(1000000000.0))),
              ("T", #SymbolicDist(#Float(1000000000000.0))),
            ]->Belt.Map.String.fromArray,
            (),
          )

          let distributionList = ForetoldAppSquiggle.ProgramEvaluator.evaluateProgram(inputs1)

          let renderExpression = response1 => 
            switch response1 {
              | #DistPlus(distPlus1) => <DistPlusPlot distPlus={ForetoldAppSquiggle.DistPlus.T.normalize(distPlus1)} />
              | #Float(f) => <NumberShower number=f precision=3 />
              | #Function((f, a), env) =>
                //  Problem: When it gets the function, it doesn't save state about previous commands
                let foo: ForetoldAppSquiggle.ProgramEvaluator.Inputs.inputs = {
                  squiggleString: squiggleString,
                  samplingInputs: inputs1.samplingInputs,
                  environment: env,
                }
                let results =
                  E.A.Floats.range(options.diagramStart, options.diagramStop, options.diagramCount)
                  |> E.A.fmap(r =>
                    ForetoldAppSquiggle.ProgramEvaluator.evaluateFunction(
                      foo,
                      (f, a),
                      [#SymbolicDist(#Float(r))],
                    ) |> E.R.bind(_, a =>
                      switch a {
                      | #DistPlus(d) => Ok((r, ForetoldAppSquiggle.DistPlus.T.normalize(d)))
                      | n =>
                        Js.log2("Error here", n)
                        Error("wrong type")
                      }
                    )
                  )
                  |> E.A.R.firstErrorOrOpen
                switch results {
                | Ok(dists) => <PercentilesChart dists />
                | Error(r) => r |> R.ste
                }
              }

          // Render the list of distributions given by the
          switch distributionList {
            | Ok(xs) =>
                let childrenElements = List.map(renderExpression, xs)
                Js.Console.log(childrenElements)
                <ul>
                  {Belt.List.toArray(Belt.List.mapWithIndex(childrenElements, (i, child) => <li key={Belt.Int.toString(i)}>child</li>))->React.array}
                </ul>
            | Error(r) => r |> R.ste
          }
        | _ => "Nothing to show. Try to change the distribution description." |> R.ste
        }}
      </div>
    </Antd.Card>
}

@react.component
let make = () => {
  let (reloader, setReloader) = React.useState(() => 1)
  let reform = Form.use(
    ~validationStrategy=OnDemand,
    ~schema=Form.Validation.Schema([]),
    ~onSubmit=({state}) => None,
    ~initialState={
      //squiggleString: "mm(normal(-10, 2), uniform(18, 25), lognormal({mean: 10, stdev: 8}), triangular(31,40,50))",
      squiggleString: "mm(normal(5,2), normal(10,2))",
      sampleCount: "1000",
      outputXYPoints: "1000",
      downsampleTo: "",
      kernelWidth: "",
      diagramStart: "0",
      diagramStop: "10",
      diagramCount: "20",
    },
    (),
  )

  let onSubmit = e => {
    e->ReactEvent.Synthetic.preventDefault
    reform.submit()
  }

  let squiggleString = reform.state.values.squiggleString
  let sampleCount = reform.state.values.sampleCount |> Js.Float.fromString
  let outputXYPoints = reform.state.values.outputXYPoints |> Js.Float.fromString
  let downsampleTo = reform.state.values.downsampleTo |> Js.Float.fromString
  let kernelWidth = reform.state.values.kernelWidth |> Js.Float.fromString
  let diagramStart = reform.state.values.diagramStart |> Js.Float.fromString
  let diagramStop = reform.state.values.diagramStop |> Js.Float.fromString
  let diagramCount = reform.state.values.diagramCount |> Js.Float.fromString

  let options = switch (sampleCount, outputXYPoints, downsampleTo) {
  | (_, _, _)
    if !Js.Float.isNaN(sampleCount) &&
    (!Js.Float.isNaN(outputXYPoints) &&
    (!Js.Float.isNaN(downsampleTo) && (sampleCount > 10. && outputXYPoints > 10.))) =>
    Some({
      sampleCount: sampleCount |> int_of_float,
      outputXYPoints: outputXYPoints |> int_of_float,
      downsampleTo: int_of_float(downsampleTo) > 0 ? Some(int_of_float(downsampleTo)) : None,
      kernelWidth: kernelWidth == 0.0 ? None : Some(kernelWidth),
      diagramStart: diagramStart,
      diagramStop: diagramStop,
      diagramCount: diagramCount |> int_of_float,
    })
  | _ => None
  }

  let demoDist = React.useMemo1(
    () => <DemoDist squiggleString options />,
    [
      reform.state.values.squiggleString,
      reform.state.values.sampleCount,
      reform.state.values.outputXYPoints,
      reform.state.values.downsampleTo,
      reform.state.values.kernelWidth,
      reform.state.values.diagramStart,
      reform.state.values.diagramStop,
      reform.state.values.diagramCount,
      reloader |> string_of_int,
    ],
  )

  let onReload = _ => setReloader(_ => reloader + 1)

  <div className="grid grid-cols-2 gap-4">
    <div>
      <Antd.Card
        title={"Distribution Form" |> R.ste}>
        <Form.Provider value=reform>
          <Antd.Form onSubmit>
            <Row _type="flex" className=Styles.rows>
              <Col span=24> <FieldText field=FormConfig.SquiggleString label="Program" /> </Col>
            </Row>
            <Row _type="flex" className=Styles.rows>
              <Col span=12> <FieldFloat field=FormConfig.SampleCount label="Sample Count" /> </Col>
              <Col span=12>
                <FieldFloat field=FormConfig.OutputXYPoints label="Output XY-points" />
              </Col>
              <Col span=12>
                <FieldFloat field=FormConfig.DownsampleTo label="Downsample To" />
              </Col>
              <Col span=12> <FieldFloat field=FormConfig.KernelWidth label="Kernel Width" /> </Col>
              <Col span=12>
                <FieldFloat field=FormConfig.DiagramStart label="Diagram Start" />
              </Col>
              <Col span=12> <FieldFloat field=FormConfig.DiagramStop label="Diagram Stop" /> </Col>
              <Col span=12>
                <FieldFloat field=FormConfig.DiagramCount label="Diagram Count" />
              </Col>
            </Row>
          </Antd.Form>
        </Form.Provider>
      </Antd.Card>
    </div>
    <div> demoDist </div>
  </div>
}
