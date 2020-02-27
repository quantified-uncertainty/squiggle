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
    ]);
  let form = style([backgroundColor(hex("eee")), padding(em(1.))]);
  let dist = style([padding(em(1.))]);
  let spacer = style([marginTop(em(1.))]);
};

module FieldFloat = {
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

module DemoDist = {
  [@react.component]
  let make = (~guesstimatorString, ~domain, ~unit) => {
    <Antd.Card title={"Distribution" |> E.ste}>
      <div className=Styles.spacer />
      <div>
        <div>
          {DistPlusIngredients.make(~guesstimatorString, ~domain, ~unit, ())
           |> DistPlusIngredients.toDistPlus(
                ~sampleCount=10000,
                ~outputXYPoints=2000,
                ~truncateTo=Some(1000),
              )
           |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
        </div>
      </div>
    </Antd.Card>;
  };
};

[@react.component]
let make = () => {
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
        xPoint: reform.state.values.xPoint |> float_of_string,
        excludingProbabilityMass:
          reform.state.values.excludingProbabilityMass |> float_of_string,
      })
    | "RightLimited" =>
      RightLimited({
        xPoint: reform.state.values.xPoint |> float_of_string,
        excludingProbabilityMass:
          reform.state.values.excludingProbabilityMass |> float_of_string,
      })
    | "LeftAndRightLimited" =>
      LeftAndRightLimited(
        {
          xPoint: reform.state.values.xPoint |> float_of_string,
          excludingProbabilityMass:
            reform.state.values.excludingProbabilityMass |> float_of_string,
        },
        {
          xPoint: reform.state.values.xPoint2 |> float_of_string,
          excludingProbabilityMass:
            reform.state.values.excludingProbabilityMass2 |> float_of_string,
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

  let demoDist =
    React.useMemo1(
      () => {<DemoDist guesstimatorString domain unit />},
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
      |],
    );

  <div>
    <div className=Styles.spacer />
    demoDist
    <div className=Styles.spacer />
    <Antd.Card title={"Distribution Form" |> E.ste}>
      <Form.Provider value=reform>
        <Antd.Form onSubmit>
          <FieldString
            field=FormConfig.GuesstimatorString
            label="Guesstimator String"
          />
          <Row _type=`flex>
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
            <Col span=10>
              <Row _type=`flex className=Styles.rows>
                <Col span=12>
                  <FieldString field=FormConfig.XPoint label="X-point" />
                </Col>
                <Col span=12>
                  <FieldString
                    field=FormConfig.ExcludingProbabilityMass
                    label="Excluding Probability Mass"
                  />
                </Col>
              </Row>
            </Col>
            <Col span=10>
              <Row _type=`flex className=Styles.rows>
                <Col span=12>
                  <FieldString field=FormConfig.XPoint2 label="X-point (2)" />
                </Col>
                <Col span=12>
                  <FieldString
                    field=FormConfig.ExcludingProbabilityMass2
                    label="Excluding Probability Mass (2)"
                  />
                </Col>
              </Row>
            </Col>
          </Row>
          <Row _type=`flex>
            <Col span=4>
              <Form.Field
                field=FormConfig.UnitType
                render={({handleChange, value}) =>
                  <Antd.Form.Item label={"Zero Type" |> E.ste}>
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
            <Col span=10>
              <Row _type=`flex className=Styles.rows>
                <Col span=12>
                  <Form.Field
                    field=FormConfig.Zero
                    render={({handleChange, value}) =>
                      <Antd.Form.Item label={"Zero" |> E.ste}>
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
                <Col span=12>
                  <FieldString
                    field=FormConfig.ExcludingProbabilityMass
                    label="Excluding Probability Mass"
                  />
                </Col>
              </Row>
            </Col>
            <Col span=10 />
          </Row>
        </Antd.Form>
      </Form.Provider>
    </Antd.Card>
  </div>;
};
