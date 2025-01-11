function testFetchRouteWeatherData1() {
  route = new Route();
  route.getWaypointsFromSheet();
  route.getLegsFromSheet();

  Logger.log("Route Data: " + JSON.stringify(route));

  route.saveToCache(); // Cache route object after full creation

  try {
    Logger.log("Attempting to load route from cache...");
    const loadedRoute = Route.loadFromCache();

    if (loadedRoute) {
      Logger.log(
        "Route successfully loaded from cache. Starting weather fetch..."
      );

      const legs = loadedRoute.legs;

      const weatherVariables = ["temperature_2m", "pressure_msl"];

      for (const legNumber in legs) {
        const leg = legs[legNumber];
        try {
          Logger.log(`Fetching weather for Leg ${legNumber}...`);

          const midpoint = leg.calculateMidpoint();
          const today = new Date();
          today.setHours(12, 0, 0, 0); // Set time to 12:00 PM
          const dateString = today.toISOString().slice(0, 19) + "Z"; // Format date as ISO string

          weatherVariables.forEach((variable) => {
            const cacheKey = `_weather_${variable}`;

            if (leg[cacheKey] != null) {
              Logger.log(
                `${variable} already cached for Leg ${legNumber}: ${leg[cacheKey]}`
              );
              return; // Skip if valid data is already cached
            }

            try {
              Logger.log(`Fetching ${variable} for Leg ${legNumber}...`);
              const data = fetchWeatherData(midpoint.lat, midpoint.lon);
              leg[cacheKey] = getWeatherVariable(data, dateString, variable);
              Logger.log(
                `${variable} fetched and cached for Leg ${legNumber}: ${leg[cacheKey]}`
              );
            } catch (error) {
              Logger.log(
                `Error fetching ${variable} for Leg ${legNumber}: ${error.message}`
              );
            }
          });
          weatherVariables.forEach((variable) =>
            pushLegResults(loadedRoute, variable)
          );
        } catch (error) {
          Logger.log(
            `Failed to fetch weather data for Leg ${legNumber}: ${error.message}`
          );
        }
      }
      Logger.log("Weather data fetch completed for all legs.");
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

function testFetchRouteWeatherData2() {
  route = new Route();
  route.getWaypointsFromSheet();
  route.getLegsFromSheet();

  Logger.log("Route Data: " + JSON.stringify(route));

  route.saveToCache(); // Cache route object after full creation
  processWeatherData();
}
