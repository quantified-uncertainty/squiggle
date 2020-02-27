open BsReform;
open Antd.Grid;

module FormConfig = [%lenses
  type state = {
    guesstimatorString: string,
    //
    domainType: string, // Complete, LeftLimited(...), RightLimited(...), LeftAndRightLimited(..., ...)
    xPoint: float,
    xPoint2: float,
    excludingProbabilityMass: float,
    excludingProbabilityMass2: float,
    //
    unitType: string, // UnspecifiedDistribution, TimeDistribution(zero, unit)
    zero: MomentRe.Moment.t,
    unit: string,
    //
    sampleCount: int,
    outputXYPoints: int,
    truncateTo: int,
  }
];

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

module FieldNumber = {
  [@react.component]
  let make = (~field, ~label) => {
    <Form.Field
      field
      render={({handleChange, error, value, validate}) =>
        <Antd.Form.Item label={label |> E.ste}>
          <Antd.InputNumber
            value
            onChange={e => {
              e |> handleChange;
              ();
            }}
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
          <Antd.InputFloat
            value
            onChange={e => {
              e |> handleChange;
              ();
            }}
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
  let make =
      (
        ~guesstimatorString,
        ~domain,
        ~unit,
        ~sampleCount,
        ~outputXYPoints,
        ~truncateTo,
      ) => {
    <Antd.Card title={"Distribution" |> E.ste}>
      <div className=Styles.spacer />
      <div>
        <div>
          {DistPlusIngredients.make(~guesstimatorString, ~domain, ~unit, ())
           |> DistPlusIngredients.toDistPlus(
                ~sampleCount,
                ~outputXYPoints,
                ~truncateTo,
              )
           |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
        </div>
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
        domainType: "LeftLimited",
        xPoint: 50.0,
        xPoint2: 60.0,
        excludingProbabilityMass2: 0.5,
        excludingProbabilityMass: 0.3,
        unitType: "UnspecifiedDistribution",
        zero: MomentRe.momentNow(),
        unit: "days",
        sampleCount: 10000,
        outputXYPoints: 2000,
        truncateTo: 1000,
      },
      (),
    );

  let onSubmit = e => {
    e->ReactEvent.Synthetic.preventDefault;
    reform.submit();
  };

  let domain =
    switch (reform.state.values.domainType) {
    | "Complete" => DistTypes.Complete
    | "LeftLimited" =>
      LeftLimited({
        xPoint: reform.state.values.xPoint,
        excludingProbabilityMass: reform.state.values.excludingProbabilityMass,
      })
    | "RightLimited" =>
      RightLimited({
        xPoint: reform.state.values.xPoint,
        excludingProbabilityMass: reform.state.values.excludingProbabilityMass,
      })
    | "LeftAndRightLimited" =>
      LeftAndRightLimited(
        {
          xPoint: reform.state.values.xPoint,
          excludingProbabilityMass:
            reform.state.values.excludingProbabilityMass,
        },
        {
          xPoint: reform.state.values.xPoint2,
          excludingProbabilityMass:
            reform.state.values.excludingProbabilityMass2,
        },
      )
    | _ => Js.Exn.raiseError("domain is unknown")
    };

  let unit =
    switch (reform.state.values.unitType) {
    | "UnspecifiedDistribution" => DistTypes.UnspecifiedDistribution
    | "TimeDistribution" =>
      TimeDistribution({
        zero: reform.state.values.zero,
        unit: reform.state.values.unit |> TimeTypes.TimeUnit.ofString,
      })
    | _ => Js.Exn.raiseError("unit is unknown")
    };

  let guesstimatorString = reform.state.values.guesstimatorString;
  let sampleCount = reform.state.values.sampleCount;
  let outputXYPoints = reform.state.values.outputXYPoints;
  let truncateTo = reform.state.values.truncateTo |> E.O.some;

  let demoDist =
    React.useMemo1(
      () => {
        <DemoDist
          guesstimatorString
          domain
          unit
          sampleCount
          outputXYPoints
          truncateTo
        />
      },
      [|
        reform.state.values.guesstimatorString,
        reform.state.values.domainType,
        reform.state.values.xPoint |> string_of_float,
        reform.state.values.xPoint2 |> string_of_float,
        reform.state.values.xPoint2 |> string_of_float,
        reform.state.values.excludingProbabilityMass |> string_of_float,
        reform.state.values.excludingProbabilityMass2 |> string_of_float,
        reform.state.values.unitType,
        reform.state.values.zero |> E.M.format(E.M.format_standard),
        reform.state.values.unit,
        reform.state.values.sampleCount |> string_of_int,
        reform.state.values.outputXYPoints |> string_of_int,
        reform.state.values.truncateTo |> string_of_int,
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
                   label="X-point"
                   className=Styles.groupA
                 />
               </Col>
               <Col span=4>
                 <FieldFloat
                   field=FormConfig.ExcludingProbabilityMass
                   label="Excluding Probability Mass"
                   className=Styles.groupA
                 />
               </Col>
             </>
             |> E.showIf(
                  E.L.contains(
                    reform.state.values.domainType,
                    ["LeftLimited", "RightLimited", "LeftAndRightLimited"],
                  ),
                )}
            {<>
               <Col span=4>
                 <FieldFloat
                   field=FormConfig.XPoint2
                   label="X-point (2)"
                   className=Styles.groupB
                 />
               </Col>
               <Col span=4>
                 <FieldFloat
                   field=FormConfig.ExcludingProbabilityMass2
                   label="Excluding Probability Mass (2)"
                   className=Styles.groupB
                 />
               </Col>
             </>
             |> E.showIf(
                  E.L.contains(
                    reform.state.values.domainType,
                    ["LeftAndRightLimited"],
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
          </Row>
          <Row _type=`flex className=Styles.rows>
            <Col span=4>
              <FieldNumber field=FormConfig.SampleCount label="Sample Count" />
            </Col>
            <Col span=4>
              <FieldNumber
                field=FormConfig.OutputXYPoints
                label="Output XY-points"
              />
            </Col>
            <Col span=4>
              <FieldNumber field=FormConfig.TruncateTo label="Truncate To" />
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
