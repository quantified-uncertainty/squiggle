let response = EAFunds_Model.run(Fund(GLOBAL_HEALTH), 2029., DONATIONS);

[@react.component]
let make = () => {
  <div> {React.string(response)} </div>;
};