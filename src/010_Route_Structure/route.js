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

  async fetchRouteWeatherData() {
    const legs = this.legs;

    for (const legNumber in legs) {
      const leg = legs[legNumber];
      try {
        Logger.log(`Fetching weather for Leg ${legNumber}...`);
        await Promise.all([
          leg.fetchWeatherVariable("pressure_msl"),
          leg.fetchWeatherVariable("temperature_2m"),
        ]);
        Logger.log(
          `Leg ${legNumber} initialized with pressure_msl: ${leg._weather_pressure_msl}, temperature_2m: ${leg._weather_temperature_2m}`
        );
      } catch (error) {
        Logger.log(
          `Failed to fetch weather data for Leg ${legNumber}: ${error.message}`
        );
      }
    }
    Logger.log("Weather data fetch completed for all legs.");
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
      const route = Object.assign(new Route(), parsedData);

      // Convert legs from object to array if necessary
      if (parsedData.legs && typeof parsedData.legs === "object") {
        route.legs = Object.values(parsedData.legs).map((legData) =>
          Object.assign(new Leg(), legData)
        );
      } else {
        route.legs = [];
      }

      return route;
    } else {
      Logger.log("No route found in cache.");
      return null;
    }
  }
}
