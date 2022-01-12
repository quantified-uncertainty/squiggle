open Base;

module PageCard = PageCard;
module Tab = Tab;
module TabList = TabList;

// Could this be in some flexrow or part of Div component?
let flexRowContainer =
  Css.(style([margin2(~v=`zero, ~h=`px(-6)), alignItems(`flexEnd)]));
let flexRowItem = Css.(style([margin2(~v=`zero, ~h=`px(6))]));

type tabs =
  | SimpleTab
  | FreeformTab
  | CustomTab;

type state = {selectedTab: tabs};

type action =
  | ChangeTab(tabs);

[@react.component]
let make = (~cdf: Types.Dist.t) => {
  let (selectedTab, setSelectedTab) = React.useState(() => SimpleTab);

  <PageCard>
    <PageCard.HeaderRow>
      <PageCard.HeaderRow.Title>
        "New Prediction"->React.string
        <HelpDropdown
          content=HelpDropdown.{
            headerContent: "sdf" |> ReasonReact.string,
            bodyContent: "sdfsdfsd" |> ReasonReact.string,
          }
        />
      </PageCard.HeaderRow.Title>
    </PageCard.HeaderRow>
    <PageCard.Section flex=true padding=`none>
      <TabList
        selected=selectedTab
        onClick={key => setSelectedTab(_ => key)}
        list=[
          (SimpleTab, "Simple"),
          (FreeformTab, "Free-form"),
          (CustomTab, "Custom"),
        ]
        flex=true
      />
    </PageCard.Section>
    <PageCard.Section background=`grey border=`bottom padding=`top>
      <CdfChart__Large cdf width=None />
    </PageCard.Section>
    <PageCard.Section background=`grey>
      {switch (selectedTab) {
       | SimpleTab =>
         <Div flexDirection=`row styles=[flexRowContainer]>
           <Div flex={`num(1.0)} styles=[flexRowItem]>
             <InputLabel> "Min"->React.string </InputLabel>
             <TextInput fullWidth=true />
           </Div>
           <Div flex={`num(1.0)} styles=[flexRowItem]>
             <InputLabel> "Max"->React.string </InputLabel>
             <TextInput fullWidth=true />
           </Div>
           <Div styles=[flexRowItem]>
             <Button variant=Button.Secondary> "Clear"->React.string </Button>
           </Div>
         </Div>
       | FreeformTab => <TextInput fullWidth=true placeholder="5 to 50" />
       | CustomTab =>
         <div>
           <div>
             <DropdownSelect
               initialValue={Some("CDF")}
               values=[("CDF", "CDF"), ("PDF", "PDF")]
             />
             <Icon.Questionmark />
           </div>
           <PageCard.VerticalSpace />
           <Alert type_=`error>
             "Input is not a valid PDF"->React.string
           </Alert>
           <PageCard.VerticalSpace />
           <TextArea rows=4 fullWidth=true />
         </div>
       }}
    </PageCard.Section>
    <PageCard.Section>
      <InputLabel> "Comment"->React.string </InputLabel>
      <TextArea fullWidth=true />
      <PageCard.VerticalSpace />
      <Button variant=Button.Primary fullWidth=true size=Button.(Large)>
        "Submit Prediction"->React.string
      </Button>
    </PageCard.Section>
  </PageCard>;
};
