class Route {
  constructor() {
    this.waypoints = {};
    this.legs = {};
  }

  getWaypointsFromSheet() {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Waypoints");
    if (!sheet) {
      Logger.log("Sheet 'Waypoints' not found.");
      return;
    }
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();

    const waypoints = {};

    data.forEach((row) => {
      const [name, lat, lon] = row;
      if (name && !isNaN(lat) && !isNaN(lon)) {
        const waypoint = new Waypoint(name.trim().toUpperCase(), lat, lon);
        waypoints[waypoint.name] = waypoint;
        Logger.log(waypoint.toString());
      } else {
        Logger.log(`Invalid data for waypoint: ${row}`);
      }
    });

    this.waypoints = waypoints;
  }

  getLegsFromSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Legs");
    if (!sheet) {
      Logger.log("Sheet 'Legs' not found.");
      return;
    }
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

    const legs = {};

    for (const row of data) {
      const [legNumber, fromName, toName, targetAltitude] = row;
      const fromWaypoint = this.waypoints[fromName.trim().toUpperCase()];
      const toWaypoint = this.waypoints[toName.trim().toUpperCase()];

      if (fromWaypoint && toWaypoint) {
        const leg = new Leg(
          legNumber,
          fromWaypoint,
          toWaypoint,
          targetAltitude
        );
        legs[leg.legNumber] = leg;
      } else {
        Logger.log(
          `Waypoint not found for Leg ${legNumber}: ${fromName} to ${toName}`
        );
      }
    }
    this.legs = legs;
    Logger.log("Legs have been successfully loaded.");
  }

  fetchRouteWeatherData() {
    const legs = this.legs;
    const weatherVariables = ["temperature_2m", "pressure_msl"];

    for (const legNumber in legs) {
      const leg = legs[legNumber];
      try {
        Logger.log(`Fetching weather data for Leg ${legNumber}...`);
        leg.fetchLegWeatherData(weatherVariables);
      } catch (error) {
        Logger.log(
          `Failed to fetch weather data for Leg ${legNumber}: ${error.message}`
        );
      }
    }
    Logger.log("Weather data fetch completed for all legs.");
    weatherVariables.forEach((variable) => pushLegResults(this, variable));
  }

  saveToCache() {
    const cache = CacheService.getScriptCache();
    cache.put("route", JSON.stringify(this), 21600); // Cache for 6 hours
    Logger.log("Route saved to cache.");
  }

  static loadFromCache() {
    const cache = CacheService.getScriptCache();
    const data = cache.get("route");

    if (data) {
      Logger.log("Route retrieved from cache.");
      const parsedData = JSON.parse(data);

      // Recreate the Route object
      const route = Object.assign(new Route(), parsedData);

      // Recreate legs as instances of Leg
      for (const legNumber in parsedData.legs) {
        route.legs[legNumber] = Object.assign(
          new Leg(),
          parsedData.legs[legNumber]
        );
      }

      // Recreate waypoints as instances of Waypoint
      for (const waypointName in parsedData.waypoints) {
        route.waypoints[waypointName] = Object.assign(
          new Waypoint(),
          parsedData.waypoints[waypointName]
        );
      }

      return route;
    } else {
      Logger.log("No route found in cache.");
      return null;
    }
  }
}
