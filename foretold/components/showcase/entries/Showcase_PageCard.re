open FC;

let render = () =>
  <PageCard>
    <PageCard.HeaderRow>
      <PageCard.HeaderRow.Title>
        "PageCard.HeaderRow.Title"->React.string
      </PageCard.HeaderRow.Title>
    </PageCard.HeaderRow>
    <PageCard.BodyPadding>
      <PageCard.H1> "PageCard.H1"->React.string </PageCard.H1>
      <PageCard.P> "PageCard.P"->React.string </PageCard.P>
    </PageCard.BodyPadding>
    <PageCard.Section border=`top background=`grey>
      "Section, grey + borderTop"->React.string
    </PageCard.Section>
  </PageCard>;

let entry = EntryTypes.(entry(~title="PageCard", ~render));
