let entries =
  EntryTypes.[
    Showcase_Buttons.entry,
    Showcase_PageCard.entry,
    Showcase_NumberShower.entry,
    Showcase_MeasurableForm.entry,
    Showcase_Colors.entry,
    Showcase_AgentLink.entry,
    Showcase_MyCommunities.entry,
    folder(
      ~title="Link",
      ~children=[
        entry(~title="Link1b", ~render=() =>
          <Link> "Test link"->React.string </Link>
        ),
      ],
    ),
  ]
  @ Showcase_Charts.entries
  @ Showcase_Dropdown.entries
  @ Showcase_Menu.entries
  @ Showcase_DropdownMenu.entries
  @ Showcase_DropdownSelect.entries;