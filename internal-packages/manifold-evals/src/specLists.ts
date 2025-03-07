export type Spec = {
  id: string;
  description: string;
};

export type SpecList = {
  specs: Spec[];
};

export async function getMockSpecList(): Promise<SpecList> {
  const specs = [
    {
      id: "2plus2",
      description: "How much is 2 + 2?",
    },
    {
      id: "pianoTuners",
      description: "How many piano tuners are there in the world?",
    },
    {
      id: "worldPopulation",
      description: "How many people live in the world?",
    },
  ];

  return {
    specs,
  };
}
