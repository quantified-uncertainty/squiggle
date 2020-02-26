open BsReform;

module FormConfig = [%lenses
  type state = {
    guesstimatorString: string,
    //
    domainType: string, // Complete, LeftLimited(...), RightLimited(...), LeftAndRightLimited(..., ...)
    xPoint: string,
    excludingProbabilityMass: string,
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
  let row =
    style([display(`flex), selector("div > div", [flex(`num(1.))])]);
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
        xPoint: "0.0",
        excludingProbabilityMass: "",
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

  <Form.Provider value=reform>
    <Antd.Form onSubmit>
      <FieldString
        field=FormConfig.GuesstimatorString
        label="GuesstimatorString"
      />
      <div className=Styles.row>
        <div>
          <Form.Field
            field=FormConfig.DomainType
            render={({handleChange, value}) =>
              <Antd.Form.Item label={"Domain Type" |> E.ste}>
                <Antd.Select value onChange={e => e |> handleChange}>
                  <Antd.Select.Option value="Complete">
                    {"Complete" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="LeftLimited">
                    {"LeftLimited" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="RightLimited">
                    {"RightLimited" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="LeftAndRightLimited">
                    {"LeftAndRightLimited" |> E.ste}
                  </Antd.Select.Option>
                </Antd.Select>
              </Antd.Form.Item>
            }
          />
        </div>
        <div> <FieldString field=FormConfig.XPoint label="xPoint" /> </div>
        <div>
          <FieldString
            field=FormConfig.ExcludingProbabilityMass
            label="excludingProbabilityMass"
          />
        </div>
      </div>
      <div className=Styles.row>
        <div>
          <Form.Field
            field=FormConfig.UnitType
            render={({handleChange, value}) =>
              <Antd.Form.Item label={"Zero Type" |> E.ste}>
                <Antd.Select value onChange={e => e |> handleChange}>
                  <Antd.Select.Option value="UnspecifiedDistribution">
                    {"UnspecifiedDistribution" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="TimeDistribution">
                    {"TimeDistribution" |> E.ste}
                  </Antd.Select.Option>
                </Antd.Select>
              </Antd.Form.Item>
            }
          />
        </div>
        <div>
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
        </div>
        <div>
          <Form.Field
            field=FormConfig.Unit
            render={({handleChange, value}) =>
              <Antd.Form.Item label={"Unit" |> E.ste}>
                <Antd.Select value onChange={e => e |> handleChange}>
                  <Antd.Select.Option value="days">
                    {"days" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="hours">
                    {"hours" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="milliseconds">
                    {"milliseconds" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="minutes">
                    {"minutes" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="months">
                    {"months" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="quarters">
                    {"quarters" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="seconds">
                    {"seconds" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="weeks">
                    {"weeks" |> E.ste}
                  </Antd.Select.Option>
                  <Antd.Select.Option value="years">
                    {"years" |> E.ste}
                  </Antd.Select.Option>
                </Antd.Select>
              </Antd.Form.Item>
            }
          />
        </div>
      </div>
      <Antd.Form.Item>
        {reform.state.formState == Submitting
           ? "Loading" |> E.ste
           : <Antd.Button _type=`primary onClick=onSubmit>
               {"Submit" |> E.ste}
             </Antd.Button>}
      </Antd.Form.Item>
    </Antd.Form>
  </Form.Provider>;
};
