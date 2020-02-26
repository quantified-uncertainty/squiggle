open BsReform;

module FormConfig = [%lenses
  type state = {
    name: string,
    description: string,
    picture: string,
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

[@react.component]
let make = () => {
  let reform =
    Form.use(
      ~validationStrategy=OnDemand,
      ~schema,
      ~onSubmit=({state}) => {None},
      ~initialState={name: "", description: "", picture: ""},
      (),
    );

  let onSubmit = e => {
    e->ReactEvent.Synthetic.preventDefault;
    reform.submit();
  };

  <Form.Provider value=reform>
    <Antd.Form onSubmit>
      <FieldString field=FormConfig.Name label="Name" />
      <FieldString field=FormConfig.Description label="Description" />
      <FieldString field=FormConfig.Picture label="Picture" />
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
