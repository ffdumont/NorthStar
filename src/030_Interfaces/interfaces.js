function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("NorthStar")
    .addItem("Process Route Data", "processRouteData")
    .addItem("Fetch Weather Data", "processWeatherData")
    .addToUi();
}

function processRouteData() {
  const route = new Route();
  route.getWaypointsFromSheet();
  route.getLegsFromSheet();
  pushLegResults(route, "distance");
  pushLegResults(route, "trueTrack");
  pushLegResults(route, "magneticTrack");
  pushLegResults(route, "minimalSecurityAltitude");
  route.saveToCache(); // Cache route object after full creation
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Route data processed and distances updated!",
    "Success",
    3
  );
}

function processRouteData() {
  const route = new Route();
  route.getWaypointsFromSheet();
  route.getLegsFromSheet();
  pushLegResults(route, "distance");
  pushLegResults(route, "trueTrack");
  pushLegResults(route, "magneticTrack");
  pushLegResults(route, "minimalSecurityAltitude");
  route.saveToCache(); // Cache route object after full creation
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Route data processed and distances updated!",
    "Success",
    3
  );
}

function processWeatherData() {
  try {
    Logger.log("Attempting to load route from cache...");
    const route = Route.loadFromCache();

    if (route) {
      Logger.log(
        "Route successfully loaded from cache. Starting weather fetch..."
      );

      // Directly call fetchRouteWeatherData() synchronously
      route.fetchRouteWeatherData();

      Logger.log("Weather data fetched, saving to cache...");
      route.saveToCache();
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "Weather data fetched and applied!",
        "Success",
        3
      );
    } else {
      Logger.log("Failed to load route from cache. No route found.");
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "No route found in cache. Process route data first.",
        "Error",
        3
      );
    }
  } catch (error) {
    Logger.log("Unexpected error in fetchWeatherData: " + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Unexpected error occurred.",
      "Error",
      3
    );
  }
}
