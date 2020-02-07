'use strict';


function makeFundWithInfo(name, group, existingDonations, existingPayouts) {
  return /* record */[
          /* group */group,
          /* name */name,
          /* existingDonations */existingDonations,
          /* existingPayouts */existingPayouts
        ];
}

var funds = /* array */[
  /* record */[
    /* group : Fund */[/* ANIMAL_WELFARE */0],
    /* name */"Animal Welfare Fund",
    /* existingDonations */4000.0,
    /* existingPayouts */10.0
  ],
  /* record */[
    /* group : Fund */[/* GLOBAL_HEALTH */1],
    /* name */"Global Health Fund",
    /* existingDonations */4000.0,
    /* existingPayouts */10.0
  ],
  /* record */[
    /* group : Fund */[/* LONG_TERM_FUTURE */2],
    /* name */"Long Term Future Fund",
    /* existingDonations */4000.0,
    /* existingPayouts */10.0
  ],
  /* record */[
    /* group : Fund */[/* ANIMAL_WELFARE */0],
    /* name */"Meta Fund",
    /* existingDonations */4000.0,
    /* existingPayouts */10.0
  ],
  /* record */[
    /* group : All */0,
    /* name */"All",
    /* existingDonations */undefined,
    /* existingPayouts */undefined
  ]
];

exports.makeFundWithInfo = makeFundWithInfo;
exports.funds = funds;
/* No side effect */
