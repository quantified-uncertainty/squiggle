open BsReform;
open Antd.Grid;

module FormConfig = [%lenses type state = {guesstimatorString: string}];

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
  let dist = style([padding(em(1.))]);
  let spacer = style([marginTop(em(1.))]);
};

module DemoDist = {
  [@react.component]
  let make = (~guesstimatorString: string) => {
    let parsed1 = MathJsParser.fromString(guesstimatorString);
    let shape =
      switch (parsed1) {
      | Ok(r) => Some(SymbolicDist.toShape(10000, r))
      | _ => None
      };

    let str =
      switch (parsed1) {
      | Ok(r) => SymbolicDist.toString(r)
      | Error(e) => e
      };

    let inside =
      shape
      |> E.O.fmap(shape => {
           let distPlus =
             Distributions.DistPlus.make(
               ~shape=Continuous(Distributions.Continuous.fromShape(shape)),
               ~domain=Complete,
               ~unit=UnspecifiedDistribution,
               ~guesstimatorString=None,
               (),
             )
             |> Distributions.DistPlus.T.scaleToIntegralSum(~intendedSum=1.0);
           <DistPlusPlot distPlus />;
         })
      |> E.O.default(ReasonReact.null);
    <Antd.Card title={"Distribution" |> E.ste}>
      <div className=Styles.spacer />
      inside
      {str |> ReasonReact.string}
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
      ~initialState={guesstimatorString: "mm(1 to 1000)"},
      (),
    );

  let demoDist =
    React.useMemo1(
      () => {
        <DemoDist
          guesstimatorString={reform.state.values.guesstimatorString}
        />
      },
      [|reform.state.values.guesstimatorString|],
    );

  <div>
    <div className=Styles.spacer />
    demoDist
    <div className=Styles.spacer />
    <Antd.Card title={"Distribution Form" |> E.ste}>
      <Form.Provider value=reform>
        <Antd.Form>
          <Row _type=`flex>
            <Col span=12>
              <FieldString
                field=FormConfig.GuesstimatorString
                label="Guesstimator String"
              />
            </Col>
          </Row>
        </Antd.Form>
      </Form.Provider>
    </Antd.Card>
    <div className=Styles.spacer />
  </div>;
};