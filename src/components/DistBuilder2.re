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
    let (ys, xs) = DistEditor.getPdfFromUserInput(guesstimatorString);
    let continuous: DistTypes.xyShape = {xs, ys};
    <Antd.Card title={"Distribution" |> E.ste}>
      <div className=Styles.spacer />
      <DistributionPlot height=200 continuous />
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
      ~initialState={guesstimatorString: "normal(1, 1)  / normal(10, 1)"},
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
