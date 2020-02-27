open BsReform;
open Antd.Grid;

type shape = (array(float), array(float));

[@bs.module "./editor/main.js"]
external getPdfFromUserInput: string => shape = "get_pdf_from_user_input";

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
  let make = (~guesstimatorString: string) => {
    let (ys, xs) = getPdfFromUserInput("normal(1, 1)  / normal(10, 1)");
    let continuous: DistTypes.xyShape = {xs, ys};
    <Antd.Card title={"Distribution" |> E.ste}>
      <div className=Styles.spacer />
      <DistributionPlot height=200 continuous />
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
      ~initialState={guesstimatorString: "normal(1, 1)  / normal(10, 1)"},
      (),
    );

  let onSubmit = e => {
    e->ReactEvent.Synthetic.preventDefault;
    reform.submit();
  };

  let demoDist =
    React.useMemo1(
      () => {
        <DemoDist
          guesstimatorString={reform.state.values.guesstimatorString}
        />
      },
      [|reform.state.values.guesstimatorString|],
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
