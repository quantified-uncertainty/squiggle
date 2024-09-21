import { processSearchReplaceResponse } from "../src/squiggle/searchReplace.js";

describe("searchReplace", () => {
  describe("processSearchReplaceResponse", () => {
    test("should successfully replace text", () => {
      const originalText = "Hello, world!";
      const promptResponse = `
<<<<<<< SEARCH
Hello, world!
=======
Goodbye, world!
>>>>>>> REPLACE
      `;

      const result = processSearchReplaceResponse(originalText, promptResponse);

      expect(result.success).toBe(true);
      expect(result.value).toBe("Goodbye, world!");
    });

    test("should handle empty prompt response", () => {
      const originalText = "Hello, world!";
      const promptResponse = "";

      const result = processSearchReplaceResponse(originalText, promptResponse);

      expect(result.success).toBe(false);
      expect(result.value).toBe("Empty response received");
    });

    test("should handle no search/replace blocks", () => {
      const originalText = "Hello, world!";
      const promptResponse = `<<<<<<< SEARCH
      Text that doesn't exist
      =======
      Other Text
      >>>>>>> REPLACE`;

      const result = processSearchReplaceResponse(originalText, promptResponse);

      expect(result.success).toBe(false);
      expect(result.value).toContain("Error: Search text not found");
    });

    test("should handle search text not found", () => {
      const originalText = "Hello, world!";
      const promptResponse = `
<<<<<<< SEARCH
Nonexistent text
=======
Replacement text
>>>>>>> REPLACE
      `;

      const result = processSearchReplaceResponse(originalText, promptResponse);

      expect(result.success).toBe(false);
      expect(result.value).toContain("Error: Search text not found");
    });

    test("should handle multiple search/replace blocks", () => {
      const originalText = "Hello, world! How are you?";
      const promptResponse = `
      <<<<<<< SEARCH
      Hello, world!
      =======
      Goodbye, universe!
      >>>>>>> REPLACE
      
      <<<<<<< SEARCH
      How are you?
      =======
      How's it going?
      >>>>>>> REPLACE
        `;

      const result = processSearchReplaceResponse(originalText, promptResponse);

      expect(result.success).toBe(true);
      expect(result.value).toBe("Goodbye, universe! How's it going?");
    });

    test("should handle multiple search/replace blocks with complex changes", () => {
      const originalText = `
    @name("Total Population Projection")
    totalPopulationProjection = List.upTo(2023, 2043)
      -> List.map({|year| {year: year, population: projectedPopulation(Date(year))}})
    
    @name("📊 Test for Growth Rate")
    growthRateTest = sTest.test("Growth rate should be within reasonable bounds", {
      ||
      meanValue = mean(growthRate)
      sTest.expect(meanValue).toBeGreaterThan(0) && sTest.expect(meanValue).toBeLessThan(0.05)
    }
    
    totalPopulationProjection = List.upTo(2023, 2043)
      -> List.map({|year| {year: year, population: projectedPopulation(Date(year))}})
    
    populationOverYears = Table.make(
      totalPopulationProjection,
      {
        columns: [
          { name: "Year", fn: {|r| r.year} },
          { name: "Projected Population", fn: {|r| r.population} },
        ],
      }
    )
        `;

      const promptResponse = `
    <<<<<<< SEARCH
    @name("Total Population Projection")
    totalPopulationProjection = List.upTo(2023, 2043)
      -> List.map({|year| {year: year, population: projectedPopulation(Date(year))}})
    =======
    @name("🏙️ Total Population Projection")
    totalPopulationProjection = List.upTo(2023, 2043)
      -> List.map({|year| {year: year, population: projectedPopulation(Date(year))}})
      
    @name("🌟 Population Error Handling")
    populationErrorHandling = if List.length(totalPopulationProjection) == 0 then {
      throw("No population data available")
    } else {
      totalPopulationProjection
    }
    >>>>>>> REPLACE
    <<<<<<< SEARCH
    @name("📊 Test for Growth Rate")
    growthRateTest = sTest.test("Growth rate should be within reasonable bounds", {
    =======
    @name("📊 Growth Rate Validation Test")
    growthRateTest = sTest.test("Growth rate should be within reasonable bounds", {
    >>>>>>> REPLACE
      ||
      meanValue = mean(growthRate)
      sTest.expect(meanValue).toBeGreaterThan(0) && sTest.expect(meanValue).toBeLessThan(0.05)
    }
    >>>>>>> REPLACE
    <<<<<<< SEARCH
    totalPopulationProjection = List.upTo(2023, 2043)
      -> List.map({|year| {year: year, population: projectedPopulation(Date(year))}})
    =======
    @name("🌍 Population Summary Test")
    populationSummaryTest = sTest.test("Population should not be empty", {
      ||
      sTest.expect(List.length(totalPopulationProjection)).toBeGreaterThan(0)
    })
    >>>>>>> REPLACE
    <<<<<<< SEARCH
    populationOverYears = Table.make(
      totalPopulationProjection,
      {
        columns: [
          { name: "Year", fn: {|r| r.year} },
          { name: "Projected Population", fn: {|r| r.population} },
        ],
      }
    )
    =======
    @name("📊 Table of Population Projections")
    populationOverYears = Table.make(
      populationErrorHandling,
      {
        columns: [
          { name: "Year", fn: {|r| r.year} },
          { name: "Projected Population", fn: {|r| r.population} },
        ],
      }
    )
    >>>>>>> REPLACE
        `;

      const result = processSearchReplaceResponse(originalText, promptResponse);

      expect(result.success).toBe(true);
      expect(result.value).toContain('@name("🏙️ Total Population Projection")');
      expect(result.value).toContain('@name("🌟 Population Error Handling")');
      expect(result.value).toContain('@name("📊 Growth Rate Validation Test")');
      expect(result.value).toContain('@name("🌍 Population Summary Test")');
      expect(result.value).toContain(
        '@name("📊 Table of Population Projections")'
      );
      expect(result.value).toContain(
        "populationErrorHandling = if List.length(totalPopulationProjection) == 0 then {"
      );
      expect(result.value).toContain(
        'populationSummaryTest = sTest.test("Population should not be empty", {'
      );
      expect(result.value).not.toContain(
        '@name("Total Population Projection")'
      );
      expect(result.value).not.toContain('@name("📊 Test for Growth Rate")');
    });

    test("should handle empty SEARCH block and apply replacement to the top", () => {
      const originalText = "Existing content.\nMore content.";
      const promptResponse = `
    <<<<<<< SEARCH
    =======
    New content at the top.
    
    >>>>>>> REPLACE
        `;

      const result = processSearchReplaceResponse(originalText, promptResponse);

      expect(result.success).toBe(true);
      expect(result.value).toBe(
        "New content at the top.\n\nExisting content.\nMore content."
      );
    });

    test("should handle complex retirement simulation", () => {
      const originalText = `
import "hub:ozziegooen/sTest" as sTest

@name("Test Suite")
testSuite = sTest.describe(
  "Retirement Simulation",
  [
    sTest.test(
      "Annual expenses increase with age",
      {|| 
        sTest.expect(annualExpenses(60) > annualExpenses(30)).toBeTrue()
      }
    ),
  ]
)
`;

      const promptResponse = `
<<<<<<< SEARCH
    sTest.test(
      "Annual expenses increase with age",
      {|| 
        sTest.expect(annualExpenses(60) > annualExpenses(30)).toBeTrue()
      }
    ),
=======
    sTest.test(
      "Annual expenses increase with age",
      {|| 
        sTest.expect(mean(annualExpenses(60)) > mean(annualExpenses(30))).toBeTrue()
      }
    ),
=======
`;
      const result = processSearchReplaceResponse(originalText, promptResponse);
      console.log(result);

      expect(result.success).toBe(false);
      expect(result.value).toBe(
        "SEARCH/REPLACE syntax not correctly formatted"
      );
    });
  });
});
