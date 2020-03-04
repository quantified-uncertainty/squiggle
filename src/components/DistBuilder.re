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
    truncateTo: string,
  }
];

type options = {
  sampleCount: int,
  outputXYPoints: int,
  truncateTo: option(int),
};

module Form = ReForm.Make(FormConfig);

let schema = Form.Validation.Schema([||]);

module FieldString = {
  [@react.component]
  let make = (~field, ~label) => {
    <Form.Field
      field
      render={({handleChange, error, value, validate}) =>
        <Antd.Form.Item label={label |> E.ste}>
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
        <Antd.Form.Item label={label |> E.ste}>
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
    <Antd.Card title={"Distribution" |> E.ste}>
      <div className=Styles.spacer />
      <div>
        {switch (domain, unit, options) {
         | (Some(domain), Some(unit), Some(options)) =>
           let distPlus =
             DistPlusIngredients.make(~guesstimatorString, ~domain, ~unit, ())
             |> DistPlusIngredients.toDistPlus(
                  ~sampleCount=options.sampleCount,
                  ~outputXYPoints=options.outputXYPoints,
                  ~truncateTo=options.truncateTo,
                );
           switch (distPlus) {
           | Some(distPlus) => <DistPlusPlot distPlus />
           | _ =>
             "Correct Guesstimator string input to show a distribution."
             |> E.ste
           };
         | _ =>
           "Nothing to show. Try to change the distribution description."
           |> E.ste
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
        guesstimatorString: "mm(5 to 20, floor(normal(20,2)), [.5, .5])",
        domainType: "Complete",
        xPoint: "50.0",
        xPoint2: "60.0",
        excludingProbabilityMass2: "0.5",
        excludingProbabilityMass: "0.3",
        unitType: "UnspecifiedDistribution",
        zero: MomentRe.momentNow(),
        unit: "days",
        sampleCount: "1000",
        outputXYPoints: "2000",
        truncateTo: "500",
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
  let truncateTo = reform.state.values.truncateTo |> Js.Float.fromString;

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
    switch (sampleCount, outputXYPoints, truncateTo) {
    | (_, _, _)
        when
          !Js.Float.isNaN(sampleCount)
          && !Js.Float.isNaN(outputXYPoints)
          && !Js.Float.isNaN(truncateTo)
          && sampleCount > 10.
          && outputXYPoints > 10.
          && truncateTo > 10. =>
      Some({
        sampleCount: sampleCount |> int_of_float,
        outputXYPoints: outputXYPoints |> int_of_float,
        truncateTo: truncateTo |> int_of_float |> E.O.some,
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
        reform.state.values.truncateTo,
        reloader |> string_of_int,
      |],
    );

  let onRealod = _ => {
    setRealoader(_ => reloader + 1);
  };

  <div className=Styles.parent>
    <div className=Styles.spacer />
    demoDist
    <div className=Styles.spacer />
    <Antd.Card
      title={"Distribution Form" |> E.ste}
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
            <Col span=12>
              <FieldString
                field=FormConfig.GuesstimatorString
                label="Guesstimator String"
              />
            </Col>
          </Row>
          <Row _type=`flex className=Styles.rows>
            <Col span=4>
              <Form.Field
                field=FormConfig.DomainType
                render={({handleChange, value}) =>
                  <Antd.Form.Item label={"Domain Type" |> E.ste}>
                    <Antd.Select value onChange={e => e |> handleChange}>
                      <Antd.Select.Option value="Complete">
                        {"Complete" |> E.ste}
                      </Antd.Select.Option>
                      <Antd.Select.Option value="LeftLimited">
                        {"Left Limited" |> E.ste}
                      </Antd.Select.Option>
                      <Antd.Select.Option value="RightLimited">
                        {"Right Limited" |> E.ste}
                      </Antd.Select.Option>
                      <Antd.Select.Option value="LeftAndRightLimited">
                        {"Left And Right Limited" |> E.ste}
                      </Antd.Select.Option>
                    </Antd.Select>
                  </Antd.Form.Item>
                }
              />
            </Col>
            {<>
               <Col span=4>
                 <FieldFloat
                   field=FormConfig.XPoint
                   label="Left X-point"
                   className=Styles.groupA
                 />
               </Col>
               <Col span=4>
                 <FieldFloat
                   field=FormConfig.ExcludingProbabilityMass
                   label="Left Excluding Probability Mass"
                   className=Styles.groupA
                 />
               </Col>
             </>
             |> E.showIf(
                  E.L.contains(
                    reform.state.values.domainType,
                    ["LeftLimited", "LeftAndRightLimited"],
                  ),
                )}
            {<>
               <Col span=4>
                 <FieldFloat
                   field=FormConfig.XPoint2
                   label="Right X-point"
                   className=Styles.groupB
                 />
               </Col>
               <Col span=4>
                 <FieldFloat
                   field=FormConfig.ExcludingProbabilityMass2
                   label="Right Excluding Probability Mass"
                   className=Styles.groupB
                 />
               </Col>
             </>
             |> E.showIf(
                  E.L.contains(
                    reform.state.values.domainType,
                    ["RightLimited", "LeftAndRightLimited"],
                  ),
                )}
          </Row>
          <Row _type=`flex className=Styles.rows>
            <Col span=4>
              <Form.Field
                field=FormConfig.UnitType
                render={({handleChange, value}) =>
                  <Antd.Form.Item label={"Unit Type" |> E.ste}>
                    <Antd.Select value onChange={e => e |> handleChange}>
                      <Antd.Select.Option value="UnspecifiedDistribution">
                        {"Unspecified Distribution" |> E.ste}
                      </Antd.Select.Option>
                      <Antd.Select.Option value="TimeDistribution">
                        {"Time Distribution" |> E.ste}
                      </Antd.Select.Option>
                    </Antd.Select>
                  </Antd.Form.Item>
                }
              />
            </Col>
            {<>
               <Col span=4>
                 <Form.Field
                   field=FormConfig.Zero
                   render={({handleChange, value}) =>
                     <Antd.Form.Item label={"Zero Point" |> E.ste}>
                       <Antd_DatePicker
                         value
                         onChange={e => {
                           e |> handleChange;
                           _ => ();
                         }}
                       />
                     </Antd.Form.Item>
                   }
                 />
               </Col>
               <Col span=4>
                 <Form.Field
                   field=FormConfig.Unit
                   render={({handleChange, value}) =>
                     <Antd.Form.Item label={"Unit" |> E.ste}>
                       <Antd.Select value onChange={e => e |> handleChange}>
                         <Antd.Select.Option value="days">
                           {"Days" |> E.ste}
                         </Antd.Select.Option>
                         <Antd.Select.Option value="hours">
                           {"Hours" |> E.ste}
                         </Antd.Select.Option>
                         <Antd.Select.Option value="milliseconds">
                           {"Milliseconds" |> E.ste}
                         </Antd.Select.Option>
                         <Antd.Select.Option value="minutes">
                           {"Minutes" |> E.ste}
                         </Antd.Select.Option>
                         <Antd.Select.Option value="months">
                           {"Months" |> E.ste}
                         </Antd.Select.Option>
                         <Antd.Select.Option value="quarters">
                           {"Quarters" |> E.ste}
                         </Antd.Select.Option>
                         <Antd.Select.Option value="seconds">
                           {"Seconds" |> E.ste}
                         </Antd.Select.Option>
                         <Antd.Select.Option value="weeks">
                           {"Weeks" |> E.ste}
                         </Antd.Select.Option>
                         <Antd.Select.Option value="years">
                           {"Years" |> E.ste}
                         </Antd.Select.Option>
                       </Antd.Select>
                     </Antd.Form.Item>
                   }
                 />
               </Col>
             </>
             |> E.showIf(
                  E.L.contains(
                    reform.state.values.unitType,
                    ["TimeDistribution"],
                  ),
                )}
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
              <FieldFloat field=FormConfig.TruncateTo label="Truncate To" />
            </Col>
          </Row>
          <Antd.Button
            _type=`primary icon=Antd.IconName.reload onClick=onRealod>
            {"Update Distribution" |> E.ste}
          </Antd.Button>
        </Antd.Form>
      </Form.Provider>
    </Antd.Card>
    <div className=Styles.spacer />
  </div>;
};
