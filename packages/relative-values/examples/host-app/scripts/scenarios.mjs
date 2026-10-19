// Scenario pages (#/s1 ... #/s10): one screenshot per example
// (`screenshots/s<n>-<variant>.png`) and checks that the host-control API
// does what the page says. Used by screenshots.mjs.
import path from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const scenarioIds = [
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
];

const section = (scenario, variant) =>
  `[data-scenario="${scenario}"][data-variant="${variant}"]`;

const platformIds = [
  "dbMigration",
  "ciSpeedup",
  "observability",
  "costDashboards",
];

function helpers(page) {
  const count = (selector) =>
    page.$$eval(selector, (elements) => elements.length);
  const texts = (selector) =>
    page.$$eval(selector, (elements) =>
      elements.map((el) => el.textContent?.trim() ?? "")
    );
  const text = async (selector) =>
    (await page
      .$eval(selector, (el) => el.textContent ?? "")
      .catch(() => "")) ?? "";
  const attrs = (selector, name) =>
    page.$$eval(
      selector,
      (elements, name) => elements.map((el) => el.getAttribute(name)),
      name
    );
  const rows = (scope) =>
    attrs(`${scope} [data-rv-part="list-row"]`, "data-rv-item");
  const medians = async (scope) =>
    (
      await attrs(
        `${scope} [data-rv-part="list-row"] [data-rv-median]`,
        "data-rv-median"
      )
    ).map(Number);
  const clickText = async (selector, label) => {
    const handles = await page.$$(selector);
    for (const handle of handles) {
      const content = await handle.evaluate((el) => el.textContent?.trim());
      if (content === label) {
        await handle.click();
        return;
      }
    }
    throw new Error(`No ${selector} with text "${label}"`);
  };
  const portal = "[data-floating-ui-portal]";
  const closePortal = async () => {
    await page.keyboard.press("Escape");
    await sleep(200);
  };
  return {
    count,
    texts,
    text,
    attrs,
    rows,
    medians,
    clickText,
    portal,
    closePortal,
  };
}

const nonIncreasing = (values) =>
  values.length > 0 && values.every((v, i) => i === 0 || values[i - 1] >= v);

// Waits until every example that has a dashboard is ready (`data-rv-ready`),
// except error examples, and nothing is computing.
export async function waitForScenarioPage(page, id) {
  await page.waitForSelector(`[data-scenario-page="${id}"]`, {
    timeout: 30_000,
  });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("[data-scenario]")].every(
        (el) =>
          el.getAttribute("data-variant") === "error" ||
          // Roots in host content (e.g. server markup) don't count.
          ![...el.querySelectorAll(".squiggle-rv")].some(
            (root) => !root.closest("[data-host-content]")
          ) ||
          !!el.querySelector("[data-rv-ready]")
      ) && !document.querySelector("[data-rv-computing]"),
    { timeout: 90_000 }
  );
  await sleep(600);
}

// Checks per page; `check(name, ok, details)` records a result.
const pageChecks = {
  async s1(page, check) {
    const h = helpers(page);
    for (const variant of ["grid", "list", "plot"]) {
      const scope = section("S1", variant);
      const chrome = await page.$$eval(
        `${scope} [data-rv-part="tab-bar"], ${scope} [data-rv-part="header"], ${scope} [data-rv-part="toolbar"], ${scope} [data-rv-compass], ${scope} [data-rv-part="cluster-filter"]`,
        (els) => els.length
      );
      const content = await h.text(`${scope} .acme-card`);
      check(
        `S1 ${variant}: one view, no chrome`,
        chrome === 0 &&
          !content.includes("Table Settings") &&
          !content.includes("Row Settings") &&
          !content.includes("Q3 initiative portfolio") &&
          (await h.count(`${scope} [data-rv-part="${variant}"]`)) === 1,
        `${chrome} chrome elements`
      );
    }
    const ranking = section("S1", "ranking");
    const rankingMedians = (
      await h.attrs(`${ranking} [data-median]`, "data-median")
    ).map(Number);
    check(
      "S1 ranking: a custom view renders ctx.rows (15, by value)",
      rankingMedians.length === 15 &&
        nonIncreasing(rankingMedians) &&
        (await h.count(`${ranking} [data-rv-part="tab-bar"]`)) === 0,
      `${rankingMedians.length} rows`
    );
    const dashboard = section("S1", "dashboard");
    check(
      "S1 dashboard: one tab, no header row",
      (await h.count(`${dashboard} [data-rv-part="header"]`)) === 0 &&
        (await h.count(`${dashboard} canvas`)) === 1,
      ""
    );
  },

  async s2(page, check) {
    const h = helpers(page);
    const scoped = await h.rows(section("S2", "scope-cluster"));
    check(
      "S2 scope by cluster: only Platform rows",
      scoped.length === 4 && scoped.every((id) => platformIds.includes(id)),
      scoped.join(", ")
    );
    const predicate = await h.attrs(
      `${section("S2", "scope-predicate")} [data-rv-part="grid"]`,
      "data-rv-count"
    );
    check(
      "S2 scope by predicate: the Data team's 4 initiatives",
      predicate[0] === "4",
      `grid rows: ${predicate[0]}`
    );
    const searchScope = section("S2", "search");
    const searchRows = await h.rows(searchScope);
    check(
      "S2 seeded search and clusters: only matches, in the seeded clusters",
      // "Single sign-on", "Usage-based billing", "Onboarding revamp".
      searchRows.join() === "sso,usageBilling,onboardingRevamp",
      searchRows.join(", ")
    );

    const top = section("S2", "top10");
    const topRows = await h.rows(top);
    const topMedians = await h.medians(top);
    check(
      "S2 top 10 in units of SSO: 10 rows, non-increasing median",
      topRows.length === 10 &&
        nonIncreasing(topMedians) &&
        (await h.count(`${top} [data-rv-part="list-table"]`)) === 1,
      topMedians.join(", ")
    );
    await page.select(`${top} [data-host-limit]`, "5");
    await sleep(300);
    check(
      "S2 host select drives limit",
      (await h.rows(top)).length === 5,
      `${(await h.rows(top)).length} rows`
    );
    await page.select(`${top} [data-host-limit]`, "10");

    const limitBy = section("S2", "limitBy");
    const before = await h.rows(limitBy);
    await h.clickText(`${limitBy} button`, "Table Settings");
    await page.waitForSelector(`${h.portal} [data-rv-sort="name"]`);
    await page.click(`${h.portal} [data-rv-sort="name"]`);
    await sleep(300);
    await h.closePortal();
    const after = await h.rows(limitBy);
    check(
      "S2 limitBy: re-sorting by name keeps the same 6",
      before.length === 6 &&
        [...before].sort().join() === [...after].sort().join() &&
        before.join() !== after.join() &&
        (await h.text(`${limitBy} [data-host-sort]`)) === "name",
      `${before.join(", ")} -> ${after.join(", ")}`
    );
    check(
      "S2 empty: the host's Empty slot",
      (await h.text(`${section("S2", "empty")} .acme-empty`)).includes(
        "filter"
      ),
      await h.text(`${section("S2", "empty")} .acme-empty`)
    );
  },

  async s3(page, check) {
    const h = helpers(page);
    const fixed = section("S3", "fixed");
    const units = await h.attrs(
      `${fixed} [data-rv-part="list-unit"]`,
      "data-rv-unit"
    );
    await h.clickText(`${fixed} button`, "Table Settings");
    await page.waitForSelector(h.portal);
    await sleep(200);
    const menu = await h.text(h.portal);
    await h.closePortal();
    check(
      "S3 fixed unit and sort: no unit pickers, no Sort by, in units of SSO",
      (await h.count(`${fixed} [data-rv-compass]`)) === 0 &&
        units.length > 0 &&
        units.every((unit) => unit === "sso") &&
        menu.includes("Clusters") &&
        !menu.includes("Sort by"),
      `units ${[...new Set(units)].join()}, menu "${menu.slice(0, 40)}"`
    );

    const controlled = section("S3", "controlled");
    await page.click(`${controlled} [data-rv-compass="auditLog"]`);
    await sleep(300);
    const readout = await h.text(`${controlled} [data-unit-readout]`);
    await page.select(`${controlled} [data-host-unit]`, "ciSpeedup");
    await sleep(300);
    const unitAfterSelect = await h.attrs(
      `${controlled} [data-rv-part="list-unit"]`,
      "data-rv-unit"
    );
    check(
      "S3 controlled unit: a compass click updates the host; the host's select updates the dashboard",
      readout === "unit: Audit log" && unitAfterSelect[0] === "ciSpeedup",
      `readout "${readout}", unit ${unitAfterSelect[0]}`
    );

    const custom = section("S3", "custom-sort");
    const order = await h.rows(custom);
    await h.clickText(`${custom} button`, "Table Settings");
    await page.waitForSelector(`${h.portal} [data-rv-sort="revenue"]`);
    const options = await h.attrs(`${h.portal} [data-rv-sort]`, "data-rv-sort");
    await h.closePortal();
    check(
      "S3 custom sort: Revenue is in the menu and orders the rows",
      order.slice(0, 4).join() ===
        "usageBilling,partnerApi,pricingExperiment,sso" &&
        options.join() === "median,uncertainty,name,revenue",
      `${order.slice(0, 4).join(", ")}; menu: ${options.join(", ")}`
    );
  },

  async s4(page, check) {
    const h = helpers(page);
    const slots = section("S4", "slots");
    const hidden = await h.text(`${slots} .acme-card`);
    check(
      "S4 slots: Acme tab bar and toolbar, hidden title and Table Settings",
      (await h.count(`${slots} .acme-segmented`)) === 1 &&
        (await h.count(`${slots} .acme-row [data-rv-part="toolbar"]`)) === 1 &&
        (await h.count(`${slots} .acme-row [data-host-export]`)) === 1 &&
        !hidden.includes("Table Settings") &&
        !hidden.includes("Q3 initiative portfolio"),
      ""
    );
    await page.click(`${slots} [data-rv-cell]`);
    await page.waitForSelector(`${slots} .acme-drawer`);
    const drawer = await h.text(`${slots} .acme-drawer-title`);
    check(
      "S4 PairDetails slot: a cell click opens the Acme drawer",
      drawer.includes("Single sign-on / Single sign-on"),
      drawer
    );
    await h.clickText(`${slots} .acme-segmented button`, "Grid");
    await sleep(400);
    const gridText = await h.text(`${slots} .acme-card`);
    check(
      "S4 hidden grid controls: no Column Settings, Cluster Diagram or mode icons",
      (await h.count(`${slots} [data-rv-part="grid"]`)) === 1 &&
        !gridText.includes("Column Settings") &&
        !gridText.includes("Cluster Diagram") &&
        (await h.count(`${slots} [data-rv-part="grid-mode"]`)) === 0 &&
        gridText.includes("Row Settings"),
      ""
    );
    await h.clickText(`${slots} .acme-segmented button`, "Plot");
    await sleep(600);
    check(
      "S4 hidden plot cluster panel",
      (await h.count(`${slots} [data-rv-part="plot"]`)) === 1 &&
        (await h.count(`${slots} [data-rv-part="cluster-filter"]`)) === 0,
      ""
    );
    await h.clickText(`${slots} .acme-segmented button`, "List");
    await sleep(300);

    const primitives = section("S4", "primitives");
    const headingFont = await page.$eval(
      `${primitives} [data-host-heading]`,
      (el) => getComputedStyle(el).fontFamily
    );
    await page.type(
      `${primitives} .acme-toolbar input[data-rv-part="search"]`,
      "audit"
    );
    await sleep(400);
    const searched = await h.rows(primitives);
    await page.click(`${primitives} [data-rv-cell]`);
    await page.waitForSelector(
      `${primitives} [data-host-aside] [data-rv-part="sidebar"]`
    );
    check(
      "S4 primitives: host header keeps its font; search and pair details work from host chrome",
      headingFont.includes("Georgia") &&
        searched.join() === "auditLog" &&
        (await h.count(
          `${primitives} .acme-toolbar [data-rv-part="unit-picker"]`
        )) === 1 &&
        (await h.count(
          `${primitives} .acme-toolbar [data-rv-part="sort-menu"]`
        )) === 1,
      `heading font ${headingFont}; rows ${searched.join()}`
    );
    const error = await h.text(`${section("S4", "error")} .acme-alert`);
    check(
      "S4 Error slot",
      error.includes("Invalid relative values bundle") &&
        (await h.count(
          `${section("S4", "error")} [data-rv-part="tab-bar"]`
        )) === 0,
      error.slice(0, 80)
    );
  },

  async s5(page, check, { url }) {
    const h = helpers(page);
    const urlScope = section("S5", "url");
    await page.goto(`${url}#/s5?rv.view=grid&rv.sort=-median&rv.limit=5`, {
      waitUntil: "load",
    });
    await waitForScenarioPage(page, "s5");
    const count = await h.attrs(
      `${urlScope} [data-rv-part="grid"]`,
      "data-rv-count"
    );
    check(
      "S5 URL: #/s5?rv.view=grid&rv.sort=-median&rv.limit=5 shows the grid with 5 rows",
      count[0] === "5",
      `grid rows: ${count[0]}`
    );
    await h.clickText(`${urlScope} button`, "Row Settings");
    await page.waitForSelector(`${h.portal} [data-rv-sort="uncertainty"]`);
    await page.click(`${h.portal} [data-rv-sort="uncertainty"]`);
    await sleep(300);
    await h.closePortal();
    const changed = await page.evaluate(() => location.hash);
    await page.goBack();
    await sleep(500);
    const back = await page.evaluate(() => location.hash);
    const query = await h.text(`${urlScope} [data-host-query]`);
    check(
      "S5 URL: a sort updates the hash; Back restores it",
      changed.includes("rv.sort=uncertainty") &&
        back.includes("rv.sort=-median") &&
        query.includes("rv.sort=-median"),
      `${changed} -> ${back}`
    );
    await h.clickText(`${urlScope} button`, "Compare SSO and audit log");
    await page.waitForSelector(`${urlScope} [data-rv-part="sidebar"]`);
    const pair = await page.$eval(
      `${urlScope} [data-rv-part="sidebar"]`,
      (el) => [
        el.getAttribute("data-rv-pair-numerator"),
        el.getAttribute("data-rv-pair-denominator"),
      ]
    );
    const hash = await page.evaluate(() => location.hash);
    const events = await h.text(`${urlScope} [data-host-events]`);
    check(
      "S5 apiRef: the button opens the list sidebar for SSO / audit log",
      pair.join() === "sso,auditLog" &&
        hash.includes("rv.pair=sso&rv.pair=auditLog") &&
        hash.includes("rv.view") === false &&
        events.includes("api: set"),
      `${pair.join(" / ")}; ${hash}`
    );

    // Preferences survive a reload.
    const prefs = section("S5", "preferences");
    await page.evaluate(() => localStorage.removeItem("acme:rv-preferences"));
    await page.click(`${prefs} [data-rv-tab="grid"]`);
    await sleep(300);
    await page.reload({ waitUntil: "load" });
    await waitForScenarioPage(page, "s5");
    const saved = await h.text(`${prefs} [data-host-saved]`);
    check(
      "S5 preferences: the view survives a reload",
      (await h.count(`${prefs} [data-rv-part="grid"]`)) === 1 &&
        saved.includes('"view":"grid"'),
      saved
    );
    await h.clickText(`${prefs} button`, "Forget preferences");
    await sleep(300);

    // Linked dashboards.
    const linked = section("S5", "linked");
    await page.click(
      `${linked} [data-linked="a"] [data-rv-compass="ciSpeedup"]`
    );
    await sleep(400);
    const plotUnit = await h.attrs(
      `${linked} [data-plot-unit]`,
      "data-plot-unit"
    );
    await page.type(
      `${linked} [data-linked="a"] input[data-rv-part="search"]`,
      "audit"
    );
    await sleep(500);
    const plotCount = await h.attrs(
      `${linked} [data-linked="b"] [data-rv-part="plot"]`,
      "data-rv-count"
    );
    check(
      "S5 linked: a unit or search change in A updates B",
      plotUnit[0] === "ciSpeedup" && plotCount[0] === "1",
      `B unit ${plotUnit[0]}, B items ${plotCount[0]}`
    );
  },

  async s6(page, check) {
    const h = helpers(page);
    const half = section("S6", "half");
    const cells = await h.count(`${half} [data-rv-part="grid-cell"]`);
    const hidden = await h.count(
      `${half} [data-rv-part="grid-cell"][data-rv-hidden]`
    );
    const gridText = await h.text(`${half} [data-rv-part="grid"]`);
    const width = await page.$eval(
      `${half} [data-rv-part="grid-cell"]`,
      (el) => el.getBoundingClientRect().width
    );
    check(
      "S6 half matrix: 10 of 16 cells hidden, values only, 110px cells",
      cells === 16 &&
        hidden === 10 &&
        !/\dom/.test(gridText) &&
        Math.round(width) === 110,
      `${hidden}/${cells} hidden, width ${width}px`
    );
    const bands = section("S6", "bands");
    const columns = await h.attrs(
      `${bands} [data-rv-part="grid"]`,
      "data-rv-columns"
    );
    const rowCount = await h.attrs(
      `${bands} [data-rv-part="grid"]`,
      "data-rv-count"
    );
    check(
      "S6 research rows × top-5 columns, with cluster bands",
      columns[0] === "5" &&
        rowCount[0] === "3" &&
        (await h.count(`${bands} [data-rv-part="grid-band"]`)) > 1,
      `${rowCount[0]} rows × ${columns[0]} columns`
    );
    const explicit = section("S6", "explicit");
    const headers = await h.attrs(
      `${explicit} [data-rv-column-header]`,
      "data-rv-column-header"
    );
    check(
      "S6 explicit rows and columns, in the given order",
      headers.join() === "sso,onboardingRevamp,ciSpeedup,forecastingModel" &&
        (
          await h.attrs(`${explicit} [data-rv-part="grid"]`, "data-rv-count")
        )[0] === "3",
      headers.join(", ")
    );
    check(
      "S6 cluster diagram as the main view",
      (await h.count(
        `${section("S6", "clusters")} [data-rv-part="cluster-diagram"] [data-rv-row]`
      )) === 16,
      ""
    );
  },

  async s7(page, check) {
    const h = helpers(page);
    const canvasHeights = (scope) =>
      page.$$eval(`${scope} canvas`, (els) =>
        els.map((el) => [
          el.getAttribute("data-rv-plot"),
          Math.round(el.getBoundingClientRect().height),
        ])
      );
    const value = section("S7", "value");
    const valueCanvases = await canvasHeights(value);
    const valueText = await h.text(`${value} .acme-card`);
    check(
      "S7 value/uncertainty only: one 320px canvas, no Clusters panel, no titles",
      valueCanvases.length === 1 &&
        valueCanvases[0][0] === "valueUncertainty" &&
        valueCanvases[0][1] === 320 &&
        (await h.count(`${value} [data-rv-part="cluster-filter"]`)) === 0 &&
        !valueText.includes("Value and Uncertainty"),
      JSON.stringify(valueCanvases)
    );
    const similarity = await canvasHeights(section("S7", "similarity"));
    check(
      "S7 similarity map only, 360px",
      similarity.length === 1 &&
        similarity[0][0] === "similarity" &&
        similarity[0][1] === 360,
      JSON.stringify(similarity)
    );
  },

  async s8(page, check) {
    const h = helpers(page);
    const top = section("S8", "top5");
    const medians = (await h.attrs(`${top} li`, "data-median")).map(Number);
    check(
      "S8 headless top 5 (bundle): 5 items, descending",
      medians.length === 5 && nonIncreasing(medians),
      medians.join(", ")
    );
    const live = section("S8", "live");
    const liveMedians = (await h.attrs(`${live} li`, "data-median")).map(
      Number
    );
    check(
      "S8 headless top 5 (live): values once computed",
      liveMedians.length === 5 &&
        nonIncreasing(liveMedians) &&
        (await h.attrs(`${live} [data-host-top]`, "data-status"))[0] ===
          "ready",
      liveMedians.join(", ")
    );
    check(
      "S8 custom chart from rows",
      (await h.count(`${section("S8", "chart")} svg g`)) === 15,
      ""
    );
  },

  async s9(page, check) {
    const h = helpers(page);
    const scope = section("S9", "french");
    const root = await page.$eval(`${scope} .squiggle-rv`, (el) => ({
      className: el.className,
      font: getComputedStyle(el).fontFamily,
    }));
    const content = await h.text(`${scope} .acme-card`);
    const selectedTab = await page.$eval(
      `${scope} [data-rv-tab][aria-pressed="true"]`,
      (el) => getComputedStyle(el).boxShadow
    );
    await h.clickText(`${scope} button`, "Réglages du tableau");
    await page.waitForSelector(`${h.portal} .squiggle-rv`);
    const portalClass = await page.$eval(
      `${h.portal} .squiggle-rv`,
      (el) => el.className
    );
    const menu = await h.text(h.portal);
    await h.closePortal();
    check(
      "S9 labels: French strings",
      content.includes("Liste") &&
        content.includes("Réglages du tableau") &&
        menu.includes("Trier par"),
      ""
    );
    check(
      "S9 format: factor uncertainty and decimal commas",
      content.includes("×/÷") &&
        /\d,\d/.test(content) &&
        content.includes(" à "),
      ""
    );
    check(
      "S9 compact density and theme class on the root and the portal",
      root.className.includes("squiggle-rv-compact") &&
        root.className.includes("acme-rv") &&
        portalClass.includes("squiggle-rv-compact") &&
        portalClass.includes("acme-rv"),
      `root "${root.className}", portal "${portalClass}"`
    );
    check(
      "S9 theme variables: font and accent",
      root.font.includes("Avenir") && selectedTab.includes("rgb(11, 61, 145)"),
      `font ${root.font}; selected tab ${selectedTab}`
    );
  },

  async s10(page, check) {
    const h = helpers(page);
    const bundle = section("S10", "bundle");
    check(
      "S10 two views on one bundle object, both scoped",
      (await h.rows(bundle)).length === 4 &&
        (
          await h.attrs(`${bundle} [data-rv-part="grid"]`, "data-rv-count")
        )[0] === "4",
      ""
    );
    const evaluator = section("S10", "evaluator");
    await page.waitForFunction(
      (scope) => {
        const el = document.querySelector(`${scope} [data-host-writes]`);
        return el && Number(el.getAttribute("data-host-writes")) >= 144;
      },
      { timeout: 30_000 },
      evaluator
    );
    await sleep(600);
    const writes = await page.$eval(`${evaluator} [data-host-writes]`, (el) => [
      el.getAttribute("data-host-writes"),
      el.getAttribute("data-host-duplicates"),
    ]);
    check(
      "S10 one live evaluator, two dashboards: each pair computed once",
      writes[0] === "144" && writes[1] === "0",
      `${writes[0]} pairs written, ${writes[1]} more than once`
    );
    const provider = section("S10", "provider");
    await page.type(`${provider} input[data-rv-part="search"]`, "audit");
    await sleep(500);
    check(
      "S10 one provider: the shared search filters the list and the plot",
      (await h.rows(provider)).join() === "auditLog" &&
        (
          await h.attrs(`${provider} [data-rv-part="plot"]`, "data-rv-count")
        )[0] === "1",
      ""
    );
    check(
      "S10 server markup: renderToStaticMarkup renders all 15 rows",
      (
        await h.attrs(
          `${section("S10", "ssr")} [data-host-ssr-rows]`,
          "data-host-ssr-rows"
        )
      )[0] === "15",
      ""
    );
  },
};

/** Screenshots and checks of every scenario page. */
export async function runScenarios({ browser, url, outDir, root, check }) {
  for (const id of scenarioIds) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(`${url}#/${id}`, { waitUntil: "load" });

    let sawComputing = false;
    if (id === "s8") {
      // Live mode: progress first, then values.
      await page.waitForSelector(
        `${section("S8", "live")} [data-rv-computing]`,
        { timeout: 60_000 }
      );
      sawComputing = true;
    }
    await waitForScenarioPage(page, id);
    if (id === "s8") {
      check(
        "S8 live mode shows [data-rv-computing], then values",
        sawComputing,
        ""
      );
    }

    const ready = await page.$$eval(
      "[data-scenario]",
      (sections) =>
        sections.filter(
          (el) =>
            [...el.querySelectorAll(".squiggle-rv")].some(
              (root) => !root.closest("[data-host-content]")
            ) &&
            el.getAttribute("data-variant") !== "error" &&
            !el.querySelector("[data-rv-ready]")
        ).length
    );
    check(
      `${id}: [data-rv-ready] on every example`,
      ready === 0,
      `${ready} not ready`
    );

    // Screenshots before the interactive checks change the examples.
    const variants = await page.$$eval("[data-scenario]", (sections) =>
      sections.map((el) => [
        el.getAttribute("data-scenario"),
        el.getAttribute("data-variant"),
      ])
    );
    for (const [scenario, variant] of variants) {
      const element = await page.$(section(scenario, variant));
      const file = path.join(
        outDir,
        `${scenario.toLowerCase()}-${variant}.png`
      );
      await element.screenshot({ path: file });
      console.log(`  ${path.relative(root, file)}`);
    }

    try {
      await pageChecks[id](page, check, { url });
    } catch (error) {
      check(`${id}: checks ran`, false, String(error));
    }
    check(`${id}: no page errors`, errors.length === 0, errors.join("; "));
    await page.close();
  }
}
