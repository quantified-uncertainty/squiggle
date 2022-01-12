open FC.Base;

let alerts = () =>
  <div>
    <Alert type_=`primary> "Primary alert"->React.string </Alert>
    <Alert type_=`info> "Info alert"->React.string </Alert>
    <Alert type_=`success> "Success alert"->React.string </Alert>
    <Alert type_=`warning> "Warning alert"->React.string </Alert>
    <Alert type_=`error> "Error alert"->React.string </Alert>
  </div>;

let entry = EntryTypes.(entry(~title="Alerts", ~render=alerts));
