import fs from "fs";
import { Command } from "@commander-js/extra-typings";
import open from "open";
import { sq, SqProject } from "@quri/squiggle-lang";
import { SqSampleSetDistribution } from "@quri/squiggle-lang/dist/src/public/SqDistribution";


const wrapper = sq`
{|x, y|
  dist = fn(x, y) -> SampleSet.fromDist
  {
    dist: dist,
    median: inv(dist, 0.5),
    min: inv(dist, 0.05),
    max: inv(dist, 0.95),
    db: 10 * (SampleSet.map(dist, abs) -> log10 -> stdev)
  }
}
`;

const items = [
  {
    id: "walking_in_nature_10min",
    name: "Walking in Nature (10 min)",
    clusterId: "physicalAndMentalHealthActivities",
  },
  {
    id: "stretching_10min",
    name: "Stretching (10 min)",
    clusterId: "physicalAndMentalHealthActivities",
  },
  {
    id: "biking_10min",
    name: "Biking (10 min)",
    clusterId: "physicalAndMentalHealthActivities",
  },
  {
    id: "meditation_10min",
    name: "Meditation (10 min)",
    clusterId: "physicalAndMentalHealthActivities",
  },
  {
    id: "taking_stairs_5floors",
    name: "Taking Stairs (5 floors)",
    clusterId: "physicalAndMentalHealthActivities",
  },
  {
    id: "strength_training_10min",
    name: "Strength Training (10 min)",
    clusterId: "physicalAndMentalHealthActivities",
  },

  {
    id: "flu_vaccine_1",
    name: "Flu Vaccine (1 time)",
    clusterId: "medsSupplements",
  },
  {
    id: "orthomega_fishoil_1cap",
    name: "Orthomega Fish Oil (1 cap)",
    clusterId: "medsSupplements",
  },
  {
    id: "enchanced_zinc_lozenges_6cap_assuming_sick",
    name: "Enhanced Zinc Lozenges (6 cap, assuming sick)",
    clusterId: "medsSupplements",
  },
  {
    id: "eating_yogurt_1serving",
    name: "Eating Yogurt (1 serving)",
    clusterId: "goodFood",
  },
  {
    id: "whole_grain_bread_1slice",
    name: "Whole Grain Bread (1 slice)",
    clusterId: "goodFood",
  },
  {
    id: "drinking_water_8oz",
    name: "Drinking Water (8 Oz)",
    clusterId: "goodFood",
  },
  {
    id: "green_tea_1cup",
    name: "Drinking Green Tea (1 cup)",
    clusterId: "goodFood",
  },
  {
    id: "turmeric_1tsp",
    name: "Taking Turmeric (1 tsp)",
    clusterId: "goodFood",
  },
  {
    id: "blueberries_1cup",
    name: "Eating Blueberries (1 cup)",
    clusterId: "goodFood",
  },
  {
    id: "extra_primary_sleep_10min",
    name: "Getting extra primary sleep (10 min)",
    clusterId: "selfCarePractices",
  },
  {
    id: "laughing_5min",
    name: "Laughing (5 min)",
    clusterId: "selfCarePractices",
  },
  {
    id: "social_interaction_30min",
    name: "Social Interaction (30 min)",
    clusterId: "selfCarePractices",
  },
  {
    id: "washing_hands_30sec",
    name: "Washing hands (30 sec)",
    clusterId: "selfCarePractices",
  },
  {
    id: "wearing_face_mask_1day",
    name: "Wearing Face Mask (1 day)",
    clusterId: "selfCarePractices",
  },
  {
    id: "brushing_teeth_2min",
    name: "Brushing Teeth (2 min)",
    clusterId: "selfCarePractices",
  },
  {
    id: "flossing_1time",
    name: "Flossing (1 time)",
    clusterId: "selfCarePractices",
  },
  {
    id: "sunscreen_application_1",
    name: "Sunscreen application (1 time)",
    clusterId: "selfCarePractices",
  },
  {
    id: "blackcoffee_1cup",
    name: "Drinking black coffee (1 cup)",
    clusterId: "unhealthyFoodOrDrink",
  },
  {
    id: "diet_coke_250ml",
    name: "Drinking diet coke (250 mL)",
    clusterId: "unhealthyFoodOrDrink",
  },
  {
    id: "deep_fried_food_1serving",
    name: "Eating deep fried food (1 serving)",
    clusterId: "unhealthyFoodOrDrink",
  },
  {
    id: "processed_meat_1serving",
    name: "Eating processed meat (1 serving)",
    clusterId: "unhealthyFoodOrDrink",
  },
  {
    id: "brown_sugar_10g",
    name: "Taking brown sugar (10 g)",
    clusterId: "sweeteners",
  },
  {
    id: "white_sugar_10g",
    name: "Taking white sugar (10 g)",
    clusterId: "sweeteners",
  },
  {
    id: "stevia_1pack",
    name: "Taking stevia (1 pack)",
    clusterId: "sweeteners",
  },
  {
    id: "redwine_1oz",
    name: "Drinking red wine (1 oz)",
    clusterId: "wine",
  },
  {
    id: "redwine_10oz",
    name: "Drinking red wine (10 oz)",
    clusterId: "wine",
  },
  {
    id: "vomiting_2min",
    name: "Vomiting (2 min)",
    clusterId: "negativeHealthCondition",
  },
  {
    id: "mediocre_headache_10min",
    name: "Having mediocre headache (10 min)",
    clusterId: "negativeHealthCondition",
  },
  {
    id: "sitting_1hour",
    name: "Sitting (1 hour)",
    clusterId: "badHabits",
  },
  {
    id: "screen_time_1hour",
    name: "Screen time (1 hour)",
    clusterId: "badHabits",
  },
  {
    id: "smoking_cigarette_1",
    name: "Smoking cigarette (1 stick)",
    clusterId: "badHabits",
  },
];

const code = `
    brown_sugar_10g = SampleSet.fromDist(-(0.5 to 3))
    turmeric_1tsp = SampleSet.fromDist(0.1 to 2) // Turmeric has anti-inflammatory properties, but the benefits may vary
    blueberries_1cup = SampleSet.fromDist(0.5 to 5) // Blueberries are rich in antioxidants, promoting overall health
    smoking_cigarette_1 = SampleSet.fromDist(-(1 to 10)) // Smoking has severe negative health effects, such as lung cancer and heart disease
    redwine_1oz = -0.5 to 2
    meditation_10min = SampleSet.fromDist(0.5 to 10)
    orthomega_fishoil_1cap = SampleSet.fromDist(0.1 to 3)
    laughing_5min = SampleSet.fromDist(0.5 to 3)
    stretching_10min = SampleSet.fromDist(0.2 to 3.5)
    
    items = {
      walking_in_nature_10min: pointMass(1),
      stretching_10min: stretching_10min,
      biking_10min: stretching_10min*(3 to 10),
      meditation_10min: meditation_10min,// Meditation can help reduce stress and improve mental health
      taking_stairs_5floors: stretching_10min*(1 to 5),// Taking stairs increases physical activity, promoting overall health
      strength_training_10min: stretching_10min*(2 to 6), // Strength training improves muscle strength, bone density, and overall health
      
      flu_vaccine_1: 5 to 25,// Flu vaccine reduces the risk of flu-related complications
      orthomega_fishoil_1cap: orthomega_fishoil_1cap, //I'm skeptical it has a major effect
      enchanced_zinc_lozenges_6cap_assuming_sick: orthomega_fishoil_1cap*(5 to 20),
      eating_yogurt_1serving: 0.2 to 2.5, // Yogurt is a good source of probiotics, promoting gut health
      whole_grain_bread_1slice: 0.1 to 2,// Whole grain bread provides essential nutrients and fiber
      drinking_water_8oz: 0.1 to 2, // Drinking water is essential for hydration and overall health
      green_tea_1cup: turmeric_1tsp*(0.2 to 3),// Green tea has antioxidants and may provide various health benefits
      turmeric_1tsp: turmeric_1tsp,
      blueberries_1cup: blueberries_1cup,
      
      extra_primary_sleep_10min: 0.2 to 3,
      laughing_5min: laughing_5min, // Laughing can improve mood and provide short-term stress relief
      social_interaction_30min: laughing_5min*(1 to 5),// Social interaction promotes mental health and well-being
      washing_hands_30sec: 0.1 to 5,
      wearing_face_mask_1day: 0.2 to 1,
      brushing_teeth_2min: 1 to 4, // Brushing teeth prevents cavities and gum disease
      flossing_1time: 0.5 to 3, // Flossing helps remove plaque, reducing the risk of cavities and gum disease
      sunscreen_application_1: 0.5 to 10,// Sunscreen application reduces the risk of skin cancer and premature aging
      
      blackcoffee_1cup: -10 to 2, //The tolerance it gives you seems pretty negative-EV, after the first benefits
      diet_coke_250ml: -2 to 0.2,
      deep_fried_food_1serving: -(0.5 to 6), // Deep-fried food is generally high in unhealthy fats, leading to negative health effects
      processed_meat_1serving: -(0.5 to 3),// Processed meats are associated with increased risk of cancer and heart disease
      
      brown_sugar_10g: brown_sugar_10g,
      white_sugar_10g: brown_sugar_10g * (.7 to 1), //Probably very similar to brown sugar
      stevia_1pack: brown_sugar_10g * (0.001 to 0.2), //probably correlated with sugar
      redwine_1oz: redwine_1oz,
      redwine_10oz: redwine_1oz * 10,
    
      vomiting_2min: -(5 to 100),
      diarrhea_1episode: -(3 to 50), // Diarrhea can lead to dehydration and loss of nutrients, negatively impacting health
      mediocre_headache_10min: -(1 to 10),
      
      sitting_1hour: -(0.1 to 0.5), // Prolonged sitting can lead to negative health effects like obesity and heart disease
      screen_time_1hour: -(0.1 to 1),// Excessive screen time may lead to eye strain and other negative health effects
      smoking_cigarette_1: smoking_cigarette_1
      
      
    }
    withSampleSetValue(item) = SampleSet.fromDist(item)
    items = Dict.map(items, withSampleSetValue)
    
    fn(intervention1, intervention2) = items[intervention1] / items[intervention2]
`

const project = SqProject.create();
project.setSource("wrapper", wrapper);
project.setContinues("wrapper", ["model"]);
project.setSource("model", code);

const buildRelativeValue = ({
  fn,
  id1,
  id2,
}) => {
  const result = fn.call([id1, id2]);
  if (!result.ok) {
    return { ok: false, value: result.value.toString() };
  }
  const record = result.value.asJS();
  if (!(record instanceof Map)) {
    return { ok: false, value: "Expected record" };
  }

  // TODO - yup
  const dist = record.get("dist");
  const median = record.get("median");
  const min = record.get("min");
  const max = record.get("max");
  const db = record.get("db");

  if (!(dist instanceof SqSampleSetDistribution)) {
    // TODO - convert automatically?
    return { ok: false, value: "Expected sample set" };
  }

  if (typeof median !== "number") {
    return { ok: false, value: "Expected median to be a number" };
  }
  if (typeof min !== "number") {
    return { ok: false, value: "Expected min to be a number" };
  }
  if (typeof max !== "number") {
    return { ok: false, value: "Expected max to be a number" };
  }
  if (typeof db !== "number") {
    return { ok: false, value: "Expected db to be a number" };
  }

  return {
    ok: true,
    value: ({
      dist,
      median,
      min,
      max,
      db,
    }),
  };
};


export const makeProgram = () => {
  const program = new Command();

  program
    .command("run")
    .arguments("[filename]")
    .option(
      "-e, --eval <code>",
      "run a given squiggle code string instead of a file"
    )
    .action((filename, options) => {
      project.run("wrapper")
      const result = project.getResult("wrapper");
      for (const start of items) {
        for (const end of items){
          console.log(buildRelativeValue({fn: result.value.value, id1: start.id, id2: end.id}))
        }
      }
    });

  return program;
};

const main = async () => {
  await makeProgram().parseAsync();
};

if (require.main === module) {
  // running as script, https://stackoverflow.com/a/6398335
  main();
}
