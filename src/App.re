[@react.component]
let make = () => {
  <div className="w-full max-w-screen-xl mx-auto px-6">
    <FormBuilder.ModelForm model=EAFunds.Interface.model />
    <FormBuilder.ModelForm model=GlobalCatastrophe.Interface.model />
    <FormBuilder.ModelForm model=Human.Interface.model />
  </div>;
};