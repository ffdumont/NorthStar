function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("NorthStar")
    .addItem("Process Route Data", "processRouteData")
    .addItem("Fetch Weather Data", "processWeatherData")
    .addToUi();
}

function processRouteData() {
  try {
    // Step 1: Load the file
    const file = loadFileFromDrive(getNamedRangeValue("gpxGenerationDateTime"));
    Logger.log(`Processing file: ${file.getName()}`);

    // Step 2: Verify the file
    const document = verifyGPXFile(file);

    // Step 3: Load route elements
    let routes = loadRoutes(document);

    // Step 4: Process airfield waypoints
    routes = processAirfieldWaypoints(routes);

    // Step 5: Process transition waypoints
    routes = processTransitionWaypoints(routes);

    // Step 6: Split routes by airfields
    const splitRoutes = [];
    routes.forEach((route) => {
      const subRoutes = splitRoutesByAirfields(route);
      splitRoutes.push(...subRoutes);
    });

    // Step 7: Construct the flight plan
    const flightPlan = constructFlightPlan(splitRoutes);

    // Log the final flight plan
    Logger.log("Final Flight Plan:");
    Logger.log(JSON.stringify(flightPlan, null, 2));

    generateFlightPlanTextFile(flightPlan);
    generateGarminFlightPlan(flightPlan);
    flightPlan.saveToCache();
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
  }
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Route data processed and distances updated!",
    "Success",
    3
  );
}

function processWeatherData() {
  try {
    Logger.log("Attempting to load flight plan from cache...");
    const flightPlan = FlightPlan.loadFromCache();

    if (flightPlan) {
      Logger.log(
        "Flight plan successfully loaded from cache. Starting weather fetch..."
      );

      // Iterate over all routes in the flight plan
      flightPlan.routes.forEach((route) => {
        Logger.log(`Processing weather data for route: ${route.name}`);
        route.fetchRouteWeatherData();
      });
      // Log the updated flight plan
      Logger.log("Final Flight Plan:");
      Logger.log(JSON.stringify(flightPlan, null, 2));

      Logger.log(
        "Weather data fetched for all routes, saving flight plan to cache..."
      );
      flightPlan.saveToCache();

      SpreadsheetApp.getActiveSpreadsheet().toast(
        "Weather data fetched and applied for all routes!",
        "Success",
        3
      );
    } else {
      Logger.log(
        "Failed to load flight plan from cache. No flight plan found."
      );
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "No flight plan found in cache. Process flight plan data first.",
        "Error",
        3
      );
    }
  } catch (error) {
    Logger.log("Unexpected error in processWeatherData: " + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Unexpected error occurred.",
      "Error",
      3
    );
  }
}
