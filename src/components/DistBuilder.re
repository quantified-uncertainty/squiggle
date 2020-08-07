open BsReform;
open Antd.Grid;

module FormConfig = [%lenses
  type state = {
    guesstimatorString: string,
    //
    domainType: string, // Complete, LeftLimited(...), RightLimited(...), LeftAndRightLimited(..., ...)
    xPoint: string,
    xPoint2: string,
    excludingProbabilityMass: string,
    excludingProbabilityMass2: string,
    //
    unitType: string, // UnspecifiedDistribution, TimeDistribution(zero, unit)
    zero: MomentRe.Moment.t,
    unit: string,
    //
    sampleCount: string,
    outputXYPoints: string,
    downsampleTo: string,
    kernelWidth: string,
  }
];

type options = {
  sampleCount: int,
  outputXYPoints: int,
  downsampleTo: option(int),
  kernelWidth: option(float),
};

module Form = ReForm.Make(FormConfig);

let schema = Form.Validation.Schema([||]);

module FieldText = {
  [@react.component]
  let make = (~field, ~label) => {
    <Form.Field
      field
      render={({handleChange, error, value, validate}) =>
        <Antd.Form.Item label={label |> R.ste}>
          <Antd.Input.TextArea
            value
            onChange={BsReform.Helpers.handleChange(handleChange)}
            onBlur={_ => validate()}
          />
        </Antd.Form.Item>
      }
    />;
  };
};
module FieldString = {
  [@react.component]
  let make = (~field, ~label) => {
    <Form.Field
      field
      render={({handleChange, error, value, validate}) =>
        <Antd.Form.Item label={label |> R.ste}>
          <Antd.Input
            value
            onChange={BsReform.Helpers.handleChange(handleChange)}
            onBlur={_ => validate()}
          />
        </Antd.Form.Item>
      }
    />;
  };
};

module FieldFloat = {
  [@react.component]
  let make = (~field, ~label, ~className=Css.style([])) => {
    <Form.Field
      field
      render={({handleChange, error, value, validate}) =>
        <Antd.Form.Item label={label |> R.ste}>
          <Antd.Input
            value
            onChange={BsReform.Helpers.handleChange(handleChange)}
            onBlur={_ => validate()}
            className
          />
        </Antd.Form.Item>
      }
    />;
  };
};

module Styles = {
  open Css;
  let rows =
    style([
      selector(
        ">.ant-col:first-child",
        [paddingLeft(em(0.25)), paddingRight(em(0.125))],
      ),
      selector(
        ">.ant-col:last-child",
        [paddingLeft(em(0.125)), paddingRight(em(0.25))],
      ),
      selector(
        ">.ant-col:not(:first-child):not(:last-child)",
        [paddingLeft(em(0.125)), paddingRight(em(0.125))],
      ),
    ]);
  let parent =
    style([
      selector(".ant-input-number", [width(`percent(100.))]),
      selector(".anticon", [verticalAlign(`zero)]),
    ]);
  let form = style([backgroundColor(hex("eee")), padding(em(1.))]);
  let dist = style([padding(em(1.))]);
  let spacer = style([marginTop(em(1.))]);
  let groupA =
    style([
      selector(
        ".ant-input-number-input",
        [backgroundColor(hex("fff7db"))],
      ),
    ]);
  let groupB =
    style([
      selector(
        ".ant-input-number-input",
        [backgroundColor(hex("eaf4ff"))],
      ),
    ]);
};

module DemoDist = {
  [@react.component]
  let make = (~guesstimatorString, ~domain, ~unit, ~options) => {
    <Antd.Card title={"Distribution" |> R.ste}>
      <div className=Styles.spacer />
      <div>
        {switch (domain, unit, options) {
         | (Some(domain), Some(unit), Some(options)) =>
           let distPlusIngredients =
             DistPlusRenderer.Inputs.Ingredients.make(
               ~guesstimatorString,
               ~domain,
               ~unit,
               (),
             );
           let inputs1 =
             DistPlusRenderer.Inputs.make(
               ~samplingInputs={
                 sampleCount: Some(options.sampleCount),
                 outputXYPoints: Some(options.outputXYPoints),
                 kernelWidth: options.kernelWidth,
                 shapeLength:
                   Some(options.downsampleTo |> E.O.default(1000)),
               },
               ~distPlusIngredients,
               ~environment=
                 [|("p", `SymbolicDist(`Float(1.0)))|]
                 ->Belt.Map.String.fromArray,
               (),
             );

           let response1 = DistPlusRenderer.run2(inputs1);
           switch (response1) {
           | Ok(`DistPlus(distPlus1)) =>
             <DistPlusPlot distPlus={DistPlus.T.normalize(distPlus1)} />
           | Ok(`Function(f, a)) =>
             let result1 =
               DistPlusRenderer.runFunction(
                 inputs1,
                 (f, a),
                 [|`SymbolicDist(`Float(5.0))|],
               );
             let result2 =
               DistPlusRenderer.runFunction(
                 inputs1,
                 (f, a),
                 [|`SymbolicDist(`Float(10.0))|],
               );
             let result3 =
               DistPlusRenderer.runFunction(
                 inputs1,
                 (f, a),
                 [|`SymbolicDist(`Float(20.0))|],
               );
             switch (result1, result2, result3) {
             | (
                 Ok(`DistPlus(distPlus1)),
                 Ok(`DistPlus(distPlus2)),
                 Ok(`DistPlus(distPlus3)),
               ) =>
               <>
                 <DistPlusPlot distPlus={DistPlus.T.normalize(distPlus1)} />
                 <DistPlusPlot distPlus={DistPlus.T.normalize(distPlus2)} />
                 <DistPlusPlot distPlus={DistPlus.T.normalize(distPlus3)} />
               </>
             | (Error(r), _, _) => r |> R.ste
             | _ => "Failure " |> R.ste
             };
           | Error(r) => r |> R.ste
           };
         | _ =>
           "Nothing to show. Try to change the distribution description."
           |> R.ste
         }}
      </div>
    </Antd.Card>;
  };
};

[@react.component]
let make = () => {
  let (reloader, setRealoader) = React.useState(() => 1);
  let reform =
    Form.use(
      ~validationStrategy=OnDemand,
      ~schema,
      ~onSubmit=({state}) => {None},
      ~initialState={
        //guesstimatorString: "mm(normal(-10, 2), uniform(18, 25), lognormal({mean: 10, stdev: 8}), triangular(31,40,50))",
        guesstimatorString: "mm(1, 2, 3, normal(2, 1))", // , triangular(30, 40, 60)
        domainType: "Complete",
        xPoint: "50.0",
        xPoint2: "60.0",
        excludingProbabilityMass2: "0.5",
        excludingProbabilityMass: "0.3",
        unitType: "UnspecifiedDistribution",
        zero: MomentRe.momentNow(),
        unit: "days",
        sampleCount: "30000",
        outputXYPoints: "1000",
        downsampleTo: "",
        kernelWidth: "",
      },
      (),
    );

  let onSubmit = e => {
    e->ReactEvent.Synthetic.preventDefault;
    reform.submit();
  };

  let xPoint = reform.state.values.xPoint |> Js.Float.fromString;
  let xPoint2 = reform.state.values.xPoint2 |> Js.Float.fromString;
  let excludingProbabilityMass =
    reform.state.values.excludingProbabilityMass |> Js.Float.fromString;
  let excludingProbabilityMass2 =
    reform.state.values.excludingProbabilityMass2 |> Js.Float.fromString;

  let zero = reform.state.values.zero;
  let unit = reform.state.values.unit;

  let domainType = reform.state.values.domainType;
  let unitType = reform.state.values.unitType;

  let guesstimatorString = reform.state.values.guesstimatorString;
  let sampleCount = reform.state.values.sampleCount |> Js.Float.fromString;
  let outputXYPoints =
    reform.state.values.outputXYPoints |> Js.Float.fromString;
  let downsampleTo = reform.state.values.downsampleTo |> Js.Float.fromString;
  let kernelWidth = reform.state.values.kernelWidth |> Js.Float.fromString;

  let domain =
    switch (domainType) {
    | "Complete" => Some(DistTypes.Complete)
    | "LeftLimited"
        when
          !Js.Float.isNaN(xPoint)
          && !Js.Float.isNaN(excludingProbabilityMass) =>
      Some(LeftLimited({xPoint, excludingProbabilityMass}))
    | "RightLimited"
        when
          !Js.Float.isNaN(xPoint2)
          && !Js.Float.isNaN(excludingProbabilityMass2) =>
      Some(RightLimited({xPoint, excludingProbabilityMass}))
    | "LeftAndRightLimited"
        when
          !Js.Float.isNaN(xPoint)
          && !Js.Float.isNaN(excludingProbabilityMass)
          && !Js.Float.isNaN(xPoint2)
          && !Js.Float.isNaN(excludingProbabilityMass2) =>
      Some(
        LeftAndRightLimited(
          {xPoint, excludingProbabilityMass},
          {xPoint, excludingProbabilityMass},
        ),
      )
    | _ => None
    };

  let unit =
    switch (unitType) {
    | "UnspecifiedDistribution" => Some(DistTypes.UnspecifiedDistribution)
    | "TimeDistribution" =>
      Some(
        TimeDistribution({zero, unit: unit |> TimeTypes.TimeUnit.ofString}),
      )
    | _ => None
    };

  let options =
    switch (sampleCount, outputXYPoints, downsampleTo) {
    | (_, _, _)
        when
          !Js.Float.isNaN(sampleCount)
          && !Js.Float.isNaN(outputXYPoints)
          && !Js.Float.isNaN(downsampleTo)
          && sampleCount > 10.
          && outputXYPoints > 10. =>
      Some({
        sampleCount: sampleCount |> int_of_float,
        outputXYPoints: outputXYPoints |> int_of_float,
        downsampleTo:
          int_of_float(downsampleTo) > 0
            ? Some(int_of_float(downsampleTo)) : None,
        kernelWidth: kernelWidth == 0.0 ? None : Some(kernelWidth),
      })
    | _ => None
    };

  let demoDist =
    React.useMemo1(
      () => <DemoDist guesstimatorString domain unit options />,
      [|
        reform.state.values.guesstimatorString,
        reform.state.values.domainType,
        reform.state.values.xPoint,
        reform.state.values.xPoint2,
        reform.state.values.xPoint2,
        reform.state.values.excludingProbabilityMass,
        reform.state.values.excludingProbabilityMass2,
        reform.state.values.unitType,
        reform.state.values.zero |> E.M.format(E.M.format_standard),
        reform.state.values.unit,
        reform.state.values.sampleCount,
        reform.state.values.outputXYPoints,
        reform.state.values.downsampleTo,
        reform.state.values.kernelWidth,
        reloader |> string_of_int,
      |],
    );

  let onRealod = _ => {
    setRealoader(_ => reloader + 1);
  };

  <div className=Styles.parent>
    Victory.(
      <VictoryChart
        padding={"top": 1, "bottom": 9, "right": 1, "left": 3}
        minDomain=0.0
        maxDomain=2.0
        height=20
        width=20>
        <VictoryAxis
          height=200
          scale={"x": "linear", "y": "log"}
          style={
            "axis": {
              "stroke": "#aaa",
            },
            "tickLabels": {
              "fontSize": 7,
              "padding": 2,
            },
          }
        />
        <VictoryLine
          data=[|
            {"x": 0.5, "y": 0.8},
            {"x": 0.8, "y": 0.9},
            {"x": 0.2, "y": 1.1},
          |]
          style={
            "data": {
              "stroke": "#aaa",
            },
          }
        />
      </VictoryChart>
    )
    <div className=Styles.spacer />
    demoDist
    <div className=Styles.spacer />
    <Antd.Card
      title={"Distribution Form" |> R.ste}
      extra={
        <Antd.Button
          icon=Antd.IconName.reload
          shape=`circle
          onClick=onRealod
        />
      }>
      <Form.Provider value=reform>
        <Antd.Form onSubmit>
          <Row _type=`flex className=Styles.rows>
            <Col span=24>
              <FieldText field=FormConfig.GuesstimatorString label="Program" />
            </Col>
          </Row>
          <Row _type=`flex className=Styles.rows>
            <Col span=4>
              <FieldFloat field=FormConfig.SampleCount label="Sample Count" />
            </Col>
            <Col span=4>
              <FieldFloat
                field=FormConfig.OutputXYPoints
                label="Output XY-points"
              />
            </Col>
            <Col span=4>
              <FieldFloat
                field=FormConfig.DownsampleTo
                label="Downsample To"
              />
            </Col>
            <Col span=4>
              <FieldFloat field=FormConfig.KernelWidth label="Kernel Width" />
            </Col>
          </Row>
          <Antd.Button
            _type=`primary icon=Antd.IconName.reload onClick=onRealod>
            {"Update Distribution" |> R.ste}
          </Antd.Button>
        </Antd.Form>
      </Form.Provider>
    </Antd.Card>
    <div className=Styles.spacer />
  </div>;
};
